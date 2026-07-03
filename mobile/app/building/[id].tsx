import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import {
  ArrowLeft,
  Building2,
  Check,
  ChevronRight,
  Clock,
} from "lucide-react-native";
import React, { useMemo } from "react";
import { ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,  } from "react-native";

import { PrimaryButton } from "@/components/PrimaryButton";
import { StateCard } from "@/components/StateCard";
import { theme } from "@/constants/theme";
import { useBuildings } from "@/hooks/useCampusData";
import { getBuildingById } from "@/services/campus-service";
import { useQuery } from "@tanstack/react-query";

export default function BuildingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const { data: building, isLoading, error } = useQuery({
    queryKey: ["building", id],
    queryFn: () => getBuildingById(id!),
    enabled: !!id,
  });

  const handleGetDirections = () => {
    if (building) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      router.push(`/directions?buildingId=${building.id}`);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <StateCard
          title="Loading Building..."
          description="Fetching the latest campus details for you."
          loading
        />
      </View>
    );
  }

  if (!building) {
    return (
      <View style={styles.centered}>
        <StateCard
          title="Building Not Found"
          description="We couldn't find the building you're looking for. It might have been renamed or removed."
        />
        <Pressable
          style={styles.backButtonInline}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color={theme.colors.primary} />
          <Text style={styles.backButtonText}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView bounces={false} contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}>
        <View style={styles.heroContainer}>
          <Image
            source={{ uri: building.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />
          <SafeAreaView edges={["top"]} style={styles.backButtonContainer}>
            <Pressable
              style={styles.floatingBackButton}
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.colors.text} />
            </Pressable>
          </SafeAreaView>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.codeBadge}>
              <Text style={styles.codeText}>{building.code}</Text>
            </View>
            <Text style={styles.name}>{building.name}</Text>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>
                {building.category.charAt(0).toUpperCase() +
                  building.category.slice(1)}
              </Text>
            </View>
          </View>

          <Text style={styles.description}>{building.description}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <View style={styles.iconCircle}>
                <Clock size={20} color={theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.infoLabel}>Opening Hours</Text>
                <Text style={styles.infoValue}>{building.openingHours}</Text>
              </View>
            </View>
            {building.departments.length > 0 && (
              <View style={styles.infoItem}>
                <View style={styles.iconCircle}>
                  <Building2 size={20} color={theme.colors.primary} />
                </View>
                <View>
                  <Text style={styles.infoLabel}>Primary Dept</Text>
                  <Text style={styles.infoValue} numberOfLines={1}>
                    {building.departments[0]}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {building.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsContainer}
            >
              {building.tags.map((tag) => (
                <View key={tag} style={styles.tagBadge}>
                  <Text style={styles.tagText}>#{tag}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Departments</Text>
            {building.departments.map((dept, index) => (
              <View key={index} style={styles.listItem}>
                <Text style={styles.listItemText}>{dept}</Text>
                <ChevronRight size={18} color={theme.colors.textMuted} />
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Facilities</Text>
            {building.facilities.map((facility, index) => (
              <View key={index} style={styles.facilityItem}>
                <View style={styles.checkIcon}>
                  <Check size={14} color="#FFFFFF" />
                </View>
                <Text style={styles.facilityText}>{facility}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <PrimaryButton
          label="Get Directions"
          onPress={handleGetDirections}
          style={styles.directionsButton}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContent: {
    // paddingBottom is set dynamically via insets to clear the bottom bar
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: theme.colors.background,
  },
  heroContainer: {
    height: 240,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  backButtonContainer: {
    position: "absolute",
    top: 0,
    left: 16,
  },
  floatingBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8,
    ...theme.shadow,
  },
  backButtonInline: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    gap: 8,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },
  content: {
    padding: 24,
    marginTop: -20,
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  header: {
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 16,
  },
  codeBadge: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: theme.radius.pill,
  },
  codeText: {
    color: theme.colors.text,
    fontSize: 12,
    fontFamily: "Poppins_800ExtraBold",
  },
  name: {
    fontSize: 28,
    fontFamily: "Poppins_800ExtraBold",
    color: theme.colors.text,
    lineHeight: 34,
  },
  categoryBadge: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  categoryText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },
  description: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textMuted,
    lineHeight: 24,
    marginBottom: 24,
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  infoItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    padding: 12,
    borderRadius: 16,
    gap: 12,
    ...theme.shadow,
    elevation: 2,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textMuted,
  },
  infoValue: {
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.text,
  },
  tagsContainer: {
    gap: 8,
    paddingBottom: 24,
  },
  tagBadge: {
    backgroundColor: theme.colors.surfaceAlt,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: theme.radius.pill,
  },
  tagText: {
    color: theme.colors.text,
    fontSize: 13,
    fontFamily: "DMSans_400Regular",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Poppins_800ExtraBold",
    color: theme.colors.text,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  listItemText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.text,
  },
  facilityItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  checkIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  facilityText: {
    fontSize: 15,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.text,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    ...theme.shadow,
  },
  directionsButton: {
    width: "100%",
  },
});
