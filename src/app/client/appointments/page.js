'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import ClientLayout from '../../components/ClientLayout.js';

const STATUS_CLASSES = {
  Confirmed: 'client-badge client-badge--active',
  Canceled: 'client-badge client-badge--pending'
};

export default function ClientAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formState, setFormState] = useState({
    service: 'fence',
    visitType: 'Estimate',
    date: '',
    time: '',
    notes: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);

  useEffect(() => {
    let mounted = true;
    async function loadAppointments() {
      try {
        setLoading(true);
        const res = await fetch('/api/client/appointments', { cache: 'no-store' });
        const data = await res.json();
        if (!mounted) return;
        if (!res.ok) {
          setError(data?.error || 'Failed to load appointments.');
          return;
        }
        setAppointments(data.appointments || []);
      } catch (err) {
        console.error(err);
        if (mounted) setError('Failed to load appointments.');
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadAppointments();
    return () => { mounted = false; };
  }, []);

  const stats = useMemo(() => {
    const upcoming = appointments.filter(a => a.status === 'Confirmed').length;
    const canceled = appointments.length - upcoming;
    return { total: appointments.length, upcoming, canceled };
  }, [appointments]);

  const handleCancel = async (id) => { 
    if (!confirm('Cancel this appointment?')) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/client/appointments/${id}/cancel`, { 
        method: 'POST'
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data?.error || 'Cancel failed.');
      }
    } catch (err) {
      alert('Cancel failed.');
    } finally {
      setBusy(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };

  const loadSlots = async (date) => {
    try {
      const res = await fetch(`/api/client/appointments/slots?date=${date}`);
      const data = await res.json();
      setAvailableSlots(data.slots || []);
    } catch {}
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!availableSlots.includes(formState.time)) {
      alert('Invalid time slot.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch('/api/client/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formState)
      });
      if (res.ok) {
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data?.error || 'Scheduling failed.');
      }
    } catch (err) {
      alert('Scheduling failed.');
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
                className="bg-[#477a40] hover:bg-[#3d652f] text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transform hover:scale-102 active:scale-95 transition-all duration-200 whitespace-nowrap"
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
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Date & Time</th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider">Status</th>
                      <th className="text-left py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider w-48">Address & Notes</th>
                      <th className="text-center py-4 px-6 font-semibold text-sm text-gray-700 uppercase tracking-wider w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {appointments.map((appt) => (
                      <tr key={appt.id || appt.eventId} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="py-5 px-6 align-top">
                          <div className="font-semibold text-gray-900 text-base leading-tight">{appt.service}</div>
                          <div className="text-sm text-gray-500 mt-1">{appt.visitType}</div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <div className="font-semibold text-gray-900">{appt.date}</div>
                          <div className="text-sm text-gray-500">{appt.time}</div>
                        </td>
                        <td className="py-5 px-6 text-center">
                          <span className={`${STATUS_CLASSES[appt.status]} inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wide`}>
                            {appt.status}
                          </span>
                        </td>
                        <td className="py-5 px-6 align-top">
                          <div className="text-sm text-gray-900">{appt.address || 'TBD'}</div>
                          {appt.notes ? <div className="text-sm text-gray-500 mt-1 line-clamp-2">{appt.notes}</div> : null}
                        </td>
                        <td className="py-5 px-6">
                          <div className="flex flex-col sm:flex-row gap-2 justify-center">
                            {appt.status === 'Confirmed' ? (
                              <button
                                onClick={() => handleCancel(appt.id || appt.eventId)}  // ✅ Pass correct ID
                                disabled={busy}
                                className="bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-6 py-2 rounded-lg shadow-sm hover:shadow-md transform hover:scale-102 active:scale-95 transition-all duration-200 whitespace-nowrap"
                              >
                                Cancel
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))}
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
                    <option value="fence">Fence Installation</option>
                    <option value="deck-railing">Deck Railing</option>
                    <option value="pergola">Pergola</option>
                    <option value="trees-shrubs">Trees and Shrubs</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Visit Type</label>
                  <select name="visitType" value={formState.visitType} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required>
                    <option value="Estimate">Estimate</option>
                    <option value="Design Consultation">Design Consultation</option>
                    <option value="Installation">Installation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Date</label>
                  <input type="date" name="date" value={formState.date} onChange={(e) => { handleFormChange(e); loadSlots(e.target.value); }} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Time</label>
                  <select name="time" value={formState.time} onChange={handleFormChange} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" required>
                    <option value="">Select date first</option>
                    {availableSlots.map(slot => <option key={slot} value={slot}>{slot}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Notes</label>
                  <textarea name="notes" value={formState.notes} onChange={handleFormChange} rows={3} className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[#477a40] transition-all" />
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
    </ClientLayout>
  );
}



