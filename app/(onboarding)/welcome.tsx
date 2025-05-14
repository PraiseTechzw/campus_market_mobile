"use client";

import { StyleSheet, View, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import Button from "@/components/button";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { Image } from "expo-image";
const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { colors } = useTheme();

  const handleNext = () => {
    router.push("/(onboarding)/features");
  };

  const handleSkip = () => {
    router.push("/(onboarding)/final");
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.skipContainer}>
        <Button title="Skip" variant="primary" onPress={handleSkip} />
      </View>

      <View style={styles.contentContainer}>
        <Animated.View
          entering={FadeInUp.delay(300).duration(1000)}
          style={styles.imageContainer}
        >
          <Image
            source="/assets/images/welcome.png"
            style={styles.image}
            contentFit="cover"
            transition={1000}
          />
        </Animated.View>
        <Animated.View
          entering={FadeInDown.delay(600).duration(1000)}
          style={styles.textContainer}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to Campus Market
          </Text>
          <Text style={[styles.subtitle, { color: colors.textDim }]}>
            The easiest way to buy and sell items within your campus community
          </Text>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(900).duration(1000)}
        style={styles.footer}
      >
        <View style={styles.paginationContainer}>
          <View
            style={[
              styles.paginationDot,
              styles.activeDot,
              { backgroundColor: colors.tint },
            ]}
          />
          <View
            style={[styles.paginationDot, { backgroundColor: colors.border }]}
          />
          <View
            style={[styles.paginationDot, { backgroundColor: colors.border }]}
          />
          <View
            style={[styles.paginationDot, { backgroundColor: colors.border }]}
          />
        </View>

        <Button title="Next" onPress={handleNext} fullWidth />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  skipContainer: {
    alignItems: "flex-end",
    padding: 16,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  imageContainer: {
    marginBottom: 40,
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
  },
  textContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  footer: {
    padding: 24,
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 24,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 20,
  },
});
