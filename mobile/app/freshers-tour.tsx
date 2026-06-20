import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { CheckCircle2, X } from "lucide-react-native";
import React, { useState, useRef, useEffect } from "react";
import { View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Animated,
  Dimensions } from "react-native";

import { NativeMapView } from "@/components/NativeMapView";
import { PrimaryButton } from "@/components/PrimaryButton";
import { theme } from "@/constants/theme";
import { campusBuildings } from "@/mocks/campus";
import { useAppStore } from "@/store/useAppStore";

const { width } = Dimensions.get("window");

const TOUR_BUILDING_IDS = [
  "admin-tower",
  "library-complex",
  "ict-center",
  "engineering-block",
  "science-labs",
];

const FUN_FACTS: Record<string, string> = {
  "admin-tower": "This is where all your records live. You'll visit here to handle payments, ID cards, and official paperwork.",
  "library-complex": "The quietest place on campus. It's perfect for deep study and has an extensive digital archive for your research.",
  "ict-center": "Your tech home. Come here for high-speed Wi-Fi, coding labs, and technical support for your digital learning.",
  "engineering-block": "A hub of innovation. Even if you aren't an engineer, the project studios here showcase the future of campus tech.",
  "science-labs": "Practical knowledge starts here. These labs are equipped for experiments that bring your science lectures to life.",
};

export default function FreshersTourScreen() {
  const router = useRouter();
  const setHasCompletedFreshersTour = useAppStore(
    (state) => state.setHasCompletedFreshersTour
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const checkScaleAnim = useRef(new Animated.Value(0)).current;

  const currentBuildingId = TOUR_BUILDING_IDS[currentStep];
  const building = campusBuildings.find((b) => b.id === currentBuildingId);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / TOUR_BUILDING_IDS.length,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (currentStep < TOUR_BUILDING_IDS.length - 1) {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentStep(currentStep + 1);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    } else {
      setIsCompleted(true);
      Animated.spring(checkScaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleFinish = () => {
    setHasCompletedFreshersTour(true);
    router.replace("/(tabs)/map");
  };

  const handleSkip = () => {
    router.replace("/(tabs)/map");
  };

  if (isCompleted) {
    return (
      <View style={styles.completionContainer}>
        <Animated.View style={{ transform: [{ scale: checkScaleAnim }] }}>
          <CheckCircle2 size={100} color={theme.colors.primary} />
        </Animated.View>
        <Text style={styles.completionTitle}>You know your campus!</Text>
        <Text style={styles.completionSubtitle}>
          You've explored the key locations of LASUSTECH. You're ready to start
          your journey.
        </Text>
        <PrimaryButton
          label="Start Exploring"
          onPress={handleFinish}
          style={styles.finishButton}
        />
      </View>
    );
  }

  if (!building) return null;

  const mapRegion = {
    latitude: building.coordinate.latitude,
    longitude: building.coordinate.longitude,
    latitudeDelta: 0.002,
    longitudeDelta: 0.002,
  };

  const markers = [
    {
      id: building.id,
      coordinate: building.coordinate,
      title: building.name,
      color: theme.colors.primary,
    },
  ];

  return (
    <View style={styles.container}>
      <SafeAreaView edges={["top"]} style={styles.header}>
        <View style={styles.progressContainer}>
          <Animated.View
            style={[
              styles.progressBar,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>
        <View style={styles.headerActions}>
          <Text style={styles.stepIndicator}>
            Step {currentStep + 1} of {TOUR_BUILDING_IDS.length}
          </Text>
          <Pressable onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip Tour</Text>
            <X size={16} color={theme.colors.textMuted} />
          </Pressable>
        </View>
      </SafeAreaView>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <ScrollView bounces={false} showsVerticalScrollIndicator={false}>
          <Image
            source={{ uri: building.imageUrl }}
            style={styles.heroImage}
            contentFit="cover"
          />

          <View style={styles.details}>
            <Text style={styles.buildingName}>{building.name}</Text>
            <Text style={styles.funFact}>{FUN_FACTS[building.id]}</Text>

            <View style={styles.mapThumbnailContainer}>
              <NativeMapView
                region={mapRegion}
                markers={markers}
                style={styles.mapThumbnail}



              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <PrimaryButton
          label={currentStep === TOUR_BUILDING_IDS.length - 1 ? "Finish Tour" : "Mark as Visited"}
          onPress={handleNext}
          style={styles.nextButton}
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: theme.colors.background,
    zIndex: 10,
  },
  progressContainer: {
    height: 6,
    backgroundColor: theme.colors.surfaceAlt,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  progressBar: {
    height: "100%",
    backgroundColor: theme.colors.primary,
  },
  headerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  stepIndicator: {
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
    color: theme.colors.text,
  },
  skipButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: 4,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textMuted,
  },
  content: {
    flex: 1,
  },
  heroImage: {
    width: "100%",
    height: 240,
  },
  details: {
    padding: 24,
  },
  buildingName: {
    fontSize: 24,
    fontFamily: "Poppins_800ExtraBold",
    color: theme.colors.text,
    marginBottom: 12,
  },
  funFact: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textMuted,
    lineHeight: 24,
    marginBottom: 24,
  },
  mapThumbnailContainer: {
    height: 180,
    borderRadius: 20,
    overflow: "hidden",
    ...theme.shadow,
    elevation: 4,
    backgroundColor: theme.colors.surface,
  },
  mapThumbnail: {
    flex: 1,
  },
  footer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: theme.colors.background,
  },
  nextButton: {
    width: "100%",
  },
  completionContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    backgroundColor: theme.colors.background,
  },
  completionTitle: {
    fontSize: 28,
    fontFamily: "Poppins_800ExtraBold",
    color: theme.colors.text,
    marginTop: 24,
    textAlign: "center",
  },
  completionSubtitle: {
    fontSize: 16,
    fontFamily: "DMSans_400Regular",
    color: theme.colors.textMuted,
    textAlign: "center",
    marginTop: 12,
    lineHeight: 24,
    marginBottom: 40,
  },
  finishButton: {
    width: "100%",
  },
});
