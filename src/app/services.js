"use client";

import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Animated,
  Easing,
} from "react-native-web";


export default function ServicesScreen() {
  const [selectedSlug, setSelectedSlug] = React.useState(null);


  const slide = React.useRef(new Animated.Value(0)).current;


  React.useEffect(() => {
    Animated.timing(slide, {
      toValue: selectedSlug ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [selectedSlug, slide]);


  const toggleService = (slug) => {
  setSelectedSlug((prev) => (prev === slug ? null : slug));
};




  const selectedService = services.find((s) => s.slug === selectedSlug);
  const selectedLabel = selectedService
  ? `${selectedService.name} is selected`
  : "";




  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [90, 0],
  });

  const opacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });


  const onBookNow = () => {
    console.log("Book Now for:", selectedSlug);
  };


  const onGetQuote = () => {
    console.log("Get Quote for:", selectedSlug);
  };


  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent,,
        ]}
      >
        {/* ================= NAVBAR (darker) ================= */}
        <View style={styles.navbar}>
          <Text style={styles.logo}>Landscape Craftsmen</Text>


        </View>


        {/* ================= HEADER (different color) ================= */}
        <View style={styles.header}>
          <View style={styles.headerContainer}>
            <Text style={styles.headerTitle}>What We Offer</Text>
            <Text style={styles.headerSubtitle}>
              Select a service to continue. materials included, and
              easy booking.
            </Text>
          </View>
        </View>


        {/* ================= SERVICES ================= */}
        <View style={styles.pageContainer}>
          <View style={styles.servicesGrid}>
            {services.map((service) => {
              const isSelected = selectedSlug === service.slug;




              return (
                <Pressable
                  key={service.slug}
                  style={[styles.card, isSelected && styles.cardSelected]}
                  onPress={() => toggleService(service.slug)}
                >
                  <View style={styles.cardTopRow}>
                    <Text style={styles.cardTitle}>{service.name}</Text>


                    {isSelected ? (
                      <View style={styles.selectedPill}>
                        <Text style={styles.selectedPillText}>Selected</Text>
                      </View>
                    ) : (
                      <View style={styles.selectPill}>
                        <Text style={styles.selectPillText}>Select</Text>
                      </View>
                    )}
                  </View>


                  <Text style={styles.cardDescription}>{service.description}</Text>




                  <Text style={styles.metaMuted}>
                    Materials included where applicable
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>




        {/* ================= FOOTER ================= */}
        <View style={styles.footer}>
          <Text style={styles.footerTitle}>Landscape Craftsmen</Text>
          <Text style={styles.footerText}>
            Calgary, AB, Canada{"\n"}
            (403) xxx-xxxx{"\n"}
            placeholdertext@placeholder.com
          </Text>
        </View>
      </ScrollView>


      {/* ================= BOTTOM ACTION BAR (slides in) ================= */}
      <Animated.View
        style={[
          styles.bottomBar,
          {
            transform: [{ translateY }],
            opacity,
            pointerEvents: selectedSlug ? "auto" : "none",
          },
        ]}
      >
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomBarTextWrap}>
            <Text style={styles.bottomBarTitle}>{selectedLabel}</Text>
            <Text style={styles.bottomBarHint}>
              Tap card again to unselect
            </Text>
          </View>


          <View style={styles.bottomBarButtons}>
            <Pressable style={styles.primaryButton} onPress={onBookNow}>
              <Text style={styles.primaryButtonText}>Book Now</Text>
            </Pressable>


            <Pressable style={styles.secondaryButton} onPress={onGetQuote}>
              <Text style={styles.secondaryButtonText}>Get Quote</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}


/* ================= DATA ================= */


const services = [
  {
    name: "Pergola",
    slug: "Pergola",
    description:
      "A clean, modern pergola that adds shade, structure, and a standout feature to your backyard or patio space.",
    price: "60",
    duration: "45–60 min",
  },
  {
    name: "Fence Installation",
    slug: "fence-installation",
    description:
      "Professional fence installation using pressure-treated or composite materials.",
    price: "1,200",
    duration: "1–2 days",
  },
  {
    name: "Deck & Railing",
    slug: "Deck & Railing",
    description:
      "Custom decks built for comfort and longevity, paired with sturdy railings that meet code and match your home’s style.",
    price: "3,500",
    duration: "3–5 days",
  },
  {
    name: "Sod Installation",
    slug: "Sod Installation",
    description:
      "Fresh sod laid and graded properly for a smooth, green lawn with strong root take and a clean finish.",
    price: "50",
    duration: "30–45 min",
  },
  {
    name: "Trees & Shrubs",
    slug: "Trees & Shrubs",
    description:
      "Thoughtful planting of trees and shrubs for privacy, landscaping design, and low-maintenance greenery that grows well in your yard.",
    price: "2,000",
    duration: "2–4 days",
  },
];


/* ================= STYLES ================= */


const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#f4f4f5",
  },
  scroll: {
    backgroundColor: "#f4f4f5",
  },
  scrollContent: {
 },


  /* Navbar (darker) */
  navbar: {
    backgroundColor: "#0b3b2d", // darker than header
    paddingHorizontal: 24,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  logo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },
  navButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  navButtonText: {
    color: "#0b3b2d",
    fontWeight: "700",
    fontSize: 14,
  },


  /* Header (different color) */
  header: {
    backgroundColor: "#14532d",
    paddingVertical: 40,
  },
  headerContainer: {
    maxWidth: 1100,
    alignSelf: "center",
    paddingHorizontal: 24,
    width: "100%",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "900",
  },
  headerSubtitle: {
    color: "#d1fae5",
    marginTop: 8,
    fontSize: 15,
    lineHeight: 20,
  },


  /* Page container */
  pageContainer: {
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
    paddingHorizontal: 24,
    paddingVertical: 40,
  },


  /* Grid */
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 18,
    justifyContent: "center",
  },


  /* Card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 340,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    userSelect: "none",
    WebkitUserSelect: "none",
    msUserSelect: "none",
  },
  cardSelected: {
    borderColor: "#14532d",
    backgroundColor: "#f0fdf4",
  },
  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#18181b",
    flexShrink: 1,
  },
  cardDescription: {
    marginTop: 8,
    fontSize: 14,
    color: "#52525b",
    lineHeight: 20,
  },
  metaRow: {
    marginTop: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  price: {
    fontSize: 15,
    fontWeight: "800",
    color: "#14532d",
  },
  dot: {
    color: "#a1a1aa",
    fontWeight: "900",
  },
  meta: {
    fontSize: 13,
    color: "#18181b",
    fontWeight: "600",
  },
  metaMuted: {
    marginTop: 6,
    fontSize: 12,
    color: "#71717a",
  },


  /* Select pills */
  selectPill: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fafafa",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  selectPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#18181b",
  },
  selectedPill: {
    backgroundColor: "#14532d",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  selectedPillText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#fff",
  },


  /* CTA */
  cta: {
    backgroundColor: "#e5e7eb",
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  ctaTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: "#18181b",
  },
  ctaSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: "#52525b",
    textAlign: "center",
    maxWidth: 520,
    lineHeight: 20,
  },


  /* Footer */
  footer: {
    backgroundColor: "#18181b",
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    gap: 12,
  },
  footerTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  footerText: {
    color: "#a1a1aa",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  footerBadge: {
    marginTop: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerBadgeText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#18181b",
  },


  /* Bottom bar */
  bottomBar: {
    position: "fixed",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backdropFilter: "blur(8px)", // web-only (RN Web supports it)
  },
  bottomBarInner: {
    maxWidth: 1100,
    alignSelf: "center",
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    flexWrap: "wrap",
  },
  bottomBarTextWrap: {
    minWidth: 220,
  },
  bottomBarTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: "#18181b",
  },
  bottomBarHint: {
    marginTop: 2,
    fontSize: 12,
    color: "#71717a",
    fontWeight: "600",
  },
  bottomBarButtons: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#14532d",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 13,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  secondaryButtonText: {
    color: "#18181b",
    fontWeight: "900",
    fontSize: 13,
  },
});
