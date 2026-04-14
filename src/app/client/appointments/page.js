'use client';

import { useEffect, useMemo, useState } from 'react';
import ClientLayout from '../../components/ClientLayout.js';
import AppointmentCancelModal from '../../components/AppointmentCancelModal.js';
import { SERVICE_CATALOG, normalizeServiceName } from '../../lib/services/catalog.js';
import { FIELD_LIMITS, sanitizeTextArea } from '../../lib/validation/fields.js';

const STATUS_CLASSES = {
  Confirmed: 'client-badge client-badge--active',
  Canceled: 'client-badge client-badge--pending'
};

const CLIENT_VISIT_TYPES = ['Estimate', 'Design Consultation'];
const CLIENT_BOOKABLE_SERVICES = SERVICE_CATALOG.filter((service) => service.active)
  .filter((service) => service.id !== 'sod');

function getAppointmentStart(appointment) {
  const value = appointment?.startIso || '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isPastAppointment(appointment) {
  const start = getAppointmentStart(appointment);
  return !start || start.getTime() <= Date.now();
}

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [formState, setFormState] = useState({
    service: 'fence',
    visitType: 'Estimate',
    date: '',
    time: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  async function refreshAppointments() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/client/appointments', { cache: 'no-store' });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setAppointments([]);
        setError(data?.error || 'Failed to load appointments.');
        return;
      }

      setAppointments(Array.isArray(data.appointments) ? data.appointments : []);
    } catch (err) {
      console.error(err);
      setAppointments([]);
      setError('Failed to load appointments.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshAppointments();
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const upcoming = appointments.filter((appointment) => {
      const start = getAppointmentStart(appointment);
      return appointment.status === 'Confirmed' && start && start.getTime() > now;
    }).length;

    const canceled = appointments.filter((appointment) => appointment.status === 'Canceled').length;

    return {
      total: appointments.length,
      upcoming,
      canceled
    };
  }, [appointments]);

  const sortedAppointments = useMemo(() => {
    return [...appointments].sort((a, b) => {
      const aTime = getAppointmentStart(a)?.getTime() || 0;
      const bTime = getAppointmentStart(b)?.getTime() || 0;
      return bTime - aTime;
    });
  }, [appointments]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    const nextValue = name === 'notes' ? sanitizeTextArea(value, FIELD_LIMITS.notes) : value;
    setFormState((prev) => ({ ...prev, [name]: nextValue }));
  };

  const loadSlots = async (date) => {
    try {
      const res = await fetch(`/api/client/appointments/slots?date=${date}`);
      const data = await res.json().catch(() => ({}));
      setAvailableSlots(Array.isArray(data.slots) ? data.slots : []);
    } catch {
      setAvailableSlots([]);
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();

    if (!availableSlots.includes(formState.time)) {
      setError('Please choose one of the available time slots.');
      return;
    }

    setBusy(true);
    try {
      const res = await fetch('/api/client/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Scheduling failed.');
        return;
      }

      setShowForm(false);
      setFormState({
        service: 'fence',
        visitType: 'Estimate',
        date: '',
        time: '',
        notes: ''
      });
      setAvailableSlots([]);
      await refreshAppointments();
    } catch (err) {
      console.error(err);
      setError('Scheduling failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget?.id) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/client/appointments/${cancelTarget.id}/cancel`, {
        method: 'POST'
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error || 'Cancel failed.');
        return;
      }

      setCancelTarget(null);
      await refreshAppointments();
    } catch (err) {
      console.error(err);
      setError('Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ClientLayout>
      <section className="client-hero">
        <div>
          <p className="client-kicker">APPOINTMENTS</p>
          <h1 className="client-title">Your Appointments</h1>
          <p className="client-subtitle">View, cancel, or schedule site visits and estimates.</p>
          {error ? <p className="client-error">{error}</p> : null}
        </div>
      </section>

      <section>
        <section className="client-summary-grid mb-8">
          <article className="client-card client-card--stat">
            <div className="client-stat-title">Total</div>
            <div className="client-stat-value">{stats.total}</div>
          </article>
          <article className="client-card client-card--stat">
            <div className="client-stat-title">Upcoming</div>
            <div className="client-stat-value">{stats.upcoming}</div>
          </article>
          <article className="client-card client-card--stat">
            <div className="client-stat-title">Canceled</div>
            <div className="client-stat-value">{stats.canceled}</div>
          </article>
        </section>

        <section className="w-full">
          <article className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900">All Appointments</h2>
              <button
                onClick={() => setShowForm(true)}
                className="bg-[#477a40] hover:bg-[#3d652f] text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transform hover:scale-102 active:scale-95 transition-all duration-200 whitespace-nowrap hover:cursor-pointer"
                disabled={busy}
              >
                Schedule New
              </button>
            </div>

            {loading ? (
              <div className="w-full text-center py-16">
                <div className="text-gray-500 text-lg">Loading appointments...</div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="w-full text-center py-16">
                <div className="text-gray-500 text-lg">No appointments found.</div>
              </div>
            ) : (
              <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
                <table className="w-full min-w-[600px] table-auto">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Service</th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Date &amp; Time</th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider w-48">Address &amp; Notes</th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {sortedAppointments.map((appointment) => {
                      const isPast = isPastAppointment(appointment);

                      return (
                        <tr key={appointment.id || appointment.eventId} className="hover:bg-gray-50 transition-colors duration-150">
                          <td className="py-5 px-6 align-top">
                            <div className="font-semibold text-gray-900 text-base leading-tight">{normalizeServiceName(appointment.service)}</div>
                            <div className="text-sm text-gray-500 mt-1">{appointment.visitType}</div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <div className="font-semibold text-gray-900">{appointment.date}</div>
                            <div className="text-sm text-gray-500">{appointment.time}</div>
                          </td>
                          <td className="py-5 px-6 text-center">
                            <span className={`${STATUS_CLASSES[appointment.status]} inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                              {appointment.status}
                            </span>
                          </td>
                          <td className="py-5 px-6 align-top">
                            <div className="text-sm text-gray-900">{appointment.address || 'TBD'}</div>
                            {appointment.notes ? <div className="text-sm text-gray-500 mt-1 line-clamp-2">{appointment.notes}</div> : null}
                          </td>
                          <td className="py-5 px-6">
                            <div className="flex flex-col sm:flex-row gap-2 justify-center">
                              {appointment.status === 'Confirmed' ? (
                                <button
                                  onClick={() => setCancelTarget(appointment)}
                                  disabled={busy || isPast}
                                  className={`text-sm font-semibold px-6 py-2 rounded-lg shadow-sm transition-all duration-200 whitespace-nowrap ${
                                    busy || isPast
                                      ? 'bg-gray-400 cursor-not-allowed text-gray-200 shadow-none'
                                      : 'bg-red-500 hover:bg-red-600 text-white shadow-sm hover:shadow-md hover:scale-102 active:scale-95 transform'
                                  }`}
                                >
                                  {busy ? 'Canceling...' : isPast ? 'Passed' : 'Cancel'}
                                </button>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        </section>
      </section>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Schedule Appointment</h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-2xl hover:cursor-pointer">&times;</button>
            </div>
            <form onSubmit={handleSchedule}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Service</label>
                  <select name="service" value={formState.service} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required>
                    {CLIENT_BOOKABLE_SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Visit Type</label>
                  <select name="visitType" value={formState.visitType} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required>
                    {CLIENT_VISIT_TYPES.map((visitType) => (
                      <option key={visitType} value={visitType}>{visitType}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input type="date" name="date" value={formState.date} onChange={(e) => { handleFormChange(e); loadSlots(e.target.value); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                  <select name="time" value={formState.time} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required>
                    <option value="">{formState.date ? 'Select a time' : 'Select date first'}</option>
                    {availableSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" maxLength={FIELD_LIMITS.notes} value={formState.notes} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-3 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all hover:cursor-pointer" disabled={busy}>
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 px-6 bg-[#477a40] text-white font-semibold rounded-lg hover:scale-105 focus:outline-none focus:ring-4 focus:ring-green-100 transform transition-all active:scale-95 hover:cursor-pointer" disabled={busy}>
                  {busy ? 'Scheduling...' : 'Schedule Appointment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AppointmentCancelModal
        open={Boolean(cancelTarget)}
        busy={busy}
        onConfirm={handleConfirmCancel}
        onClose={() => setCancelTarget(null)}
      />
    </ClientLayout>
  );
}
