"use client";

import { StyleSheet, View, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useTheme } from "@/providers/theme-provider";
import Button from "@/components/button";
import Animated, { 
  FadeInDown, 
  FadeInUp, 
  SlideInRight, 
  ZoomIn, 
  BounceIn,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withDelay,
  withTiming,
  useSharedValue,
  withRepeat
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { useEffect } from "react";

const { width } = Dimensions.get("window");

export default function WelcomeScreen() {
  const { colors } = useTheme();
  const bounceValue = useSharedValue(0);

  useEffect(() => {
    bounceValue.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: withSpring(bounceValue.value * 10) }],
  }));

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
      <Animated.View 
        entering={SlideInRight.delay(200).springify()} 
        style={styles.skipContainer}
      >
        <Button title="Skip" variant="ghost" onPress={handleSkip} />
      </Animated.View>

      <View style={styles.contentContainer}>
        <Animated.View
          entering={FadeInUp.delay(300).duration(1000)}
          style={styles.imageContainer}
        >
          <Animated.View 
            style={[styles.iconBackground, { backgroundColor: colors.tint + "15" }, bounceStyle]}
          >
            <Animated.View entering={ZoomIn.delay(500).springify()}>
              <Feather name="shopping-bag" size={width * 0.15} color={colors.tint} />
            </Animated.View>
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(800).springify()} 
            style={[styles.decorativeIcon1, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="tag" size={24} color={colors.tint} />
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(1000).springify()} 
            style={[styles.decorativeIcon2, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="users" size={24} color={colors.tint} />
          </Animated.View>
          <Animated.View 
            entering={BounceIn.delay(1200).springify()} 
            style={[styles.decorativeIcon3, { backgroundColor: colors.tint + "10" }]}
          >
            <Feather name="message-circle" size={24} color={colors.tint} />
          </Animated.View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(600).duration(1000)}
          style={styles.textContainer}
        >
          <Animated.Text 
            entering={FadeInDown.delay(800).springify()}
            style={[styles.title, { color: colors.text }]}
          >
            Welcome to Campus Market
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(1000).springify()}
            style={[styles.subtitle, { color: colors.textDim }]}
          >
            The easiest way to buy and sell items within your campus community
          </Animated.Text>
          <Animated.View 
            entering={FadeInDown.delay(1200).springify()}
            style={styles.featureIcons}
          >
            <Animated.View 
              entering={SlideInRight.delay(1400).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="trending-up" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Easy Trading</Text>
            </Animated.View>
            <Animated.View 
              entering={SlideInRight.delay(1600).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="shield" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Secure</Text>
            </Animated.View>
            <Animated.View 
              entering={SlideInRight.delay(1800).springify()}
              style={[styles.featureIcon, { backgroundColor: colors.tint + "15" }]}
            >
              <Feather name="clock" size={20} color={colors.tint} />
              <Text style={[styles.featureText, { color: colors.textDim }]}>Fast</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </View>

      <Animated.View
        entering={FadeInUp.delay(900).duration(1000)}
        style={styles.footer}
      >
        <Animated.View 
          entering={FadeInUp.delay(1000).springify()}
          style={styles.paginationContainer}
        >
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
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(1100).springify()}>
          <Button title="Next" onPress={handleNext} fullWidth />
        </Animated.View>
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
    position: "relative",
    width: width * 0.7,
    height: width * 0.7,
    justifyContent: "center",
    alignItems: "center",
  },
  iconBackground: {
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon1: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon2: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  decorativeIcon3: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
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
    marginBottom: 32,
  },
  featureIcons: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
  },
  featureIcon: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 14,
    fontWeight: "500",
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
