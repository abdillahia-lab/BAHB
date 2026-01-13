// MARK: - NoorTheme.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import SwiftUI

// MARK: - Noor Design System

/// Central theme configuration for Noor app
/// Implements spiritual, calming aesthetics leveraging iPhone 17 display capabilities
public enum NoorTheme {

    // MARK: - Color Palette

    public enum Colors {
        // Primary Colors
        public static let emerald = Color("NoorEmerald", bundle: .main)
        public static let emeraldLight = Color(red: 13/255, green: 145/255, blue: 149/255)
        public static let emeraldDark = Color(red: 8/255, green: 85/255, blue: 89/255)

        public static let gold = Color("NoorGold", bundle: .main)
        public static let goldLight = Color(red: 232/255, green: 195/255, blue: 85/255)
        public static let goldDark = Color(red: 172/255, green: 135/255, blue: 25/255)

        // Neutral Colors
        public static let ivory = Color("NoorIvory", bundle: .main)
        public static let parchment = Color(red: 250/255, green: 245/255, blue: 235/255)
        public static let charcoal = Color(red: 45/255, green: 45/255, blue: 45/255)
        public static let ink = Color(red: 25/255, green: 25/255, blue: 25/255)

        // Accent Colors
        public static let azure = Color(red: 0/255, green: 119/255, blue: 182/255)
        public static let rose = Color(red: 183/255, green: 110/255, blue: 121/255)
        public static let sage = Color(red: 138/255, green: 154/255, blue: 137/255)

        // Semantic Colors
        public static let success = emerald
        public static let warning = gold
        public static let error = Color(red: 183/255, green: 72/255, blue: 72/255)
        public static let info = azure

        // Dark Mode Optimized (True black for OLED)
        public static let darkBackground = Color.black
        public static let darkSurface = Color(red: 18/255, green: 18/255, blue: 18/255)
        public static let darkElevated = Color(red: 28/255, green: 28/255, blue: 28/255)

        // Dynamic background based on color scheme
        public static func background(for scheme: ColorScheme) -> Color {
            scheme == .dark ? darkBackground : ivory
        }

        public static func surface(for scheme: ColorScheme) -> Color {
            scheme == .dark ? darkSurface : .white
        }

        public static func text(for scheme: ColorScheme) -> Color {
            scheme == .dark ? .white : charcoal
        }

        public static func secondaryText(for scheme: ColorScheme) -> Color {
            scheme == .dark ? Color.white.opacity(0.7) : charcoal.opacity(0.6)
        }
    }

    // MARK: - Typography

    public enum Typography {
        // Arabic Text (Quran)
        public static let quranLarge = Font.custom("Scheherazade New", size: 36)
        public static let quranMedium = Font.custom("Scheherazade New", size: 28)
        public static let quranSmall = Font.custom("Scheherazade New", size: 22)

        // Arabic Headers
        public static let arabicHeader = Font.custom("Amiri", size: 24)
        public static let arabicSubheader = Font.custom("Amiri", size: 18)

        // System Fonts (English)
        public static let displayLarge = Font.system(size: 34, weight: .bold, design: .rounded)
        public static let displayMedium = Font.system(size: 28, weight: .bold, design: .rounded)
        public static let displaySmall = Font.system(size: 22, weight: .semibold, design: .rounded)

        public static let headlineLarge = Font.system(size: 20, weight: .semibold)
        public static let headlineMedium = Font.system(size: 17, weight: .semibold)
        public static let headlineSmall = Font.system(size: 15, weight: .semibold)

        public static let bodyLarge = Font.system(size: 17, weight: .regular)
        public static let bodyMedium = Font.system(size: 15, weight: .regular)
        public static let bodySmall = Font.system(size: 13, weight: .regular)

        public static let labelLarge = Font.system(size: 14, weight: .medium)
        public static let labelMedium = Font.system(size: 12, weight: .medium)
        public static let labelSmall = Font.system(size: 11, weight: .medium)

        // Reading Font (Long-form content)
        public static let readingLarge = Font.custom("Source Serif Pro", size: 19)
        public static let readingMedium = Font.custom("Source Serif Pro", size: 17)
        public static let readingSmall = Font.custom("Source Serif Pro", size: 15)

        // Quote/Inspirational Font
        public static let quoteLarge = Font.custom("Cormorant Garamond", size: 24)
        public static let quoteMedium = Font.custom("Cormorant Garamond", size: 20)
        public static let quoteSmall = Font.custom("Cormorant Garamond", size: 16)

        // Monospaced (Timers, Countdowns)
        public static let timerLarge = Font.system(size: 48, weight: .bold, design: .monospaced)
        public static let timerMedium = Font.system(size: 32, weight: .bold, design: .monospaced)
        public static let timerSmall = Font.system(size: 20, weight: .semibold, design: .monospaced)
    }

    // MARK: - Spacing

    public enum Spacing {
        public static let xxxSmall: CGFloat = 2
        public static let xxSmall: CGFloat = 4
        public static let xSmall: CGFloat = 8
        public static let small: CGFloat = 12
        public static let medium: CGFloat = 16
        public static let large: CGFloat = 24
        public static let xLarge: CGFloat = 32
        public static let xxLarge: CGFloat = 48
        public static let xxxLarge: CGFloat = 64
    }

    // MARK: - Corner Radius

    public enum CornerRadius {
        public static let small: CGFloat = 8
        public static let medium: CGFloat = 12
        public static let large: CGFloat = 16
        public static let xLarge: CGFloat = 24
        public static let pill: CGFloat = 9999
    }

    // MARK: - Shadows

    public enum Shadows {
        public static let small = Shadow(color: .black.opacity(0.08), radius: 4, x: 0, y: 2)
        public static let medium = Shadow(color: .black.opacity(0.12), radius: 8, x: 0, y: 4)
        public static let large = Shadow(color: .black.opacity(0.16), radius: 16, x: 0, y: 8)

        public struct Shadow {
            let color: Color
            let radius: CGFloat
            let x: CGFloat
            let y: CGFloat
        }
    }

    // MARK: - Animation

    public enum Animation {
        public static let quick: SwiftUI.Animation = .easeOut(duration: 0.2)
        public static let standard: SwiftUI.Animation = .easeInOut(duration: 0.3)
        public static let slow: SwiftUI.Animation = .easeInOut(duration: 0.5)
        public static let celebration: SwiftUI.Animation = .spring(response: 0.6, dampingFraction: 0.7)

        // Spiritual animations - gentle and calming
        public static let spiritualEntrance: SwiftUI.Animation = .easeOut(duration: 0.4)
        public static let spiritualExit: SwiftUI.Animation = .easeIn(duration: 0.3)
        public static let breathe: SwiftUI.Animation = .easeInOut(duration: 2.0).repeatForever(autoreverses: true)
    }

    // MARK: - Gradients

    public enum Gradients {
        public static let emeraldGlow = LinearGradient(
            colors: [Colors.emerald, Colors.emeraldLight],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        public static let goldShimmer = LinearGradient(
            colors: [Colors.gold, Colors.goldLight],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )

        public static let sunriseGlow = LinearGradient(
            colors: [
                Color(red: 255/255, green: 200/255, blue: 100/255),
                Color(red: 255/255, green: 150/255, blue: 80/255),
                Colors.rose
            ],
            startPoint: .top,
            endPoint: .bottom
        )

        public static let nightSky = LinearGradient(
            colors: [
                Color(red: 10/255, green: 10/255, blue: 35/255),
                Color(red: 25/255, green: 25/255, blue: 60/255),
                Colors.charcoal
            ],
            startPoint: .top,
            endPoint: .bottom
        )

        public static let parchmentSubtle = LinearGradient(
            colors: [Colors.ivory, Colors.parchment],
            startPoint: .top,
            endPoint: .bottom
        )

        // Ramadan special gradient
        public static let ramadanNight = LinearGradient(
            colors: [
                Color(red: 15/255, green: 15/255, blue: 45/255),
                Color(red: 25/255, green: 20/255, blue: 55/255),
                Color(red: 45/255, green: 35/255, blue: 75/255)
            ],
            startPoint: .top,
            endPoint: .bottom
        )

        // Fasting progress gradient
        public static let fastingProgress = LinearGradient(
            colors: [Colors.emerald.opacity(0.6), Colors.gold],
            startPoint: .leading,
            endPoint: .trailing
        )
    }

    // MARK: - Islamic Patterns

    public enum Patterns {
        // Pattern names (would be actual Image assets)
        public static let geometricSubtle = "pattern_geometric_subtle"
        public static let arabesque = "pattern_arabesque"
        public static let starPattern = "pattern_eight_point_star"
        public static let floralGeometric = "pattern_floral_geometric"
    }
}

// MARK: - View Extensions

public extension View {
    /// Apply Noor card style
    func noorCard(elevated: Bool = false) -> some View {
        self
            .padding(NoorTheme.Spacing.medium)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: NoorTheme.CornerRadius.large))
            .shadow(
                color: elevated ? .black.opacity(0.12) : .black.opacity(0.06),
                radius: elevated ? 12 : 6,
                y: elevated ? 6 : 3
            )
    }

    /// Apply spiritual subtle animation on appear
    func spiritualEntrance() -> some View {
        self.transition(.asymmetric(
            insertion: .opacity.combined(with: .scale(scale: 0.95)),
            removal: .opacity
        ))
    }

    /// Apply emerald accent styling
    func emeraldAccent() -> some View {
        self.foregroundStyle(NoorTheme.Colors.emerald)
    }

    /// Apply gold accent styling
    func goldAccent() -> some View {
        self.foregroundStyle(NoorTheme.Colors.gold)
    }

    /// Apply reading mode styling (optimized for Quran reading)
    func readingMode() -> some View {
        self
            .font(NoorTheme.Typography.readingMedium)
            .lineSpacing(8)
            .padding(.horizontal, NoorTheme.Spacing.large)
    }

    /// Apply Quran Arabic text styling
    func quranTextStyle(size: QuranTextSize = .medium) -> some View {
        self
            .font(size.font)
            .lineSpacing(size.lineSpacing)
            .multilineTextAlignment(.trailing) // RTL
            .environment(\.layoutDirection, .rightToLeft)
    }
}

public enum QuranTextSize {
    case small
    case medium
    case large

    var font: Font {
        switch self {
        case .small: return NoorTheme.Typography.quranSmall
        case .medium: return NoorTheme.Typography.quranMedium
        case .large: return NoorTheme.Typography.quranLarge
        }
    }

    var lineSpacing: CGFloat {
        switch self {
        case .small: return 12
        case .medium: return 16
        case .large: return 20
        }
    }
}

// MARK: - Button Styles

public struct NoorPrimaryButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(NoorTheme.Typography.labelLarge)
            .foregroundColor(.white)
            .padding(.horizontal, NoorTheme.Spacing.large)
            .padding(.vertical, NoorTheme.Spacing.small)
            .background(
                NoorTheme.Colors.emerald
                    .opacity(configuration.isPressed ? 0.8 : 1)
            )
            .clipShape(Capsule())
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(NoorTheme.Animation.quick, value: configuration.isPressed)
    }
}

public struct NoorSecondaryButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(NoorTheme.Typography.labelLarge)
            .foregroundColor(NoorTheme.Colors.emerald)
            .padding(.horizontal, NoorTheme.Spacing.large)
            .padding(.vertical, NoorTheme.Spacing.small)
            .background(
                NoorTheme.Colors.emerald.opacity(0.1)
                    .opacity(configuration.isPressed ? 0.2 : 0.1)
            )
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(NoorTheme.Colors.emerald.opacity(0.3), lineWidth: 1)
            )
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(NoorTheme.Animation.quick, value: configuration.isPressed)
    }
}

public struct NoorGhostButtonStyle: ButtonStyle {
    public func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(NoorTheme.Typography.labelLarge)
            .foregroundColor(NoorTheme.Colors.emerald)
            .opacity(configuration.isPressed ? 0.6 : 1)
            .scaleEffect(configuration.isPressed ? 0.98 : 1)
            .animation(NoorTheme.Animation.quick, value: configuration.isPressed)
    }
}

// MARK: - Custom Shape for Islamic Patterns

public struct EightPointStar: Shape {
    public func path(in rect: CGRect) -> Path {
        var path = Path()
        let center = CGPoint(x: rect.midX, y: rect.midY)
        let outerRadius = min(rect.width, rect.height) / 2
        let innerRadius = outerRadius * 0.4

        for i in 0..<8 {
            let outerAngle = Angle(degrees: Double(i) * 45 - 90)
            let innerAngle = Angle(degrees: Double(i) * 45 + 22.5 - 90)

            let outerPoint = CGPoint(
                x: center.x + cos(outerAngle.radians) * outerRadius,
                y: center.y + sin(outerAngle.radians) * outerRadius
            )
            let innerPoint = CGPoint(
                x: center.x + cos(innerAngle.radians) * innerRadius,
                y: center.y + sin(innerAngle.radians) * innerRadius
            )

            if i == 0 {
                path.move(to: outerPoint)
            } else {
                path.addLine(to: outerPoint)
            }
            path.addLine(to: innerPoint)
        }
        path.closeSubpath()

        return path
    }
}

// MARK: - Environment Keys

private struct NoorThemeKey: EnvironmentKey {
    static let defaultValue: NoorColorScheme = .light
}

public enum NoorColorScheme {
    case light
    case dark
    case sepia
    case ramadan
}

public extension EnvironmentValues {
    var noorColorScheme: NoorColorScheme {
        get { self[NoorThemeKey.self] }
        set { self[NoorThemeKey.self] = newValue }
    }
}

// MARK: - Preview Helpers

#Preview("Color Palette") {
    ScrollView {
        VStack(spacing: 20) {
            Text("Noor Color Palette")
                .font(NoorTheme.Typography.displayMedium)

            HStack(spacing: 12) {
                colorSwatch(NoorTheme.Colors.emerald, "Emerald")
                colorSwatch(NoorTheme.Colors.gold, "Gold")
                colorSwatch(NoorTheme.Colors.azure, "Azure")
                colorSwatch(NoorTheme.Colors.rose, "Rose")
            }

            HStack(spacing: 12) {
                colorSwatch(NoorTheme.Colors.ivory, "Ivory")
                colorSwatch(NoorTheme.Colors.charcoal, "Charcoal")
                colorSwatch(NoorTheme.Colors.sage, "Sage")
            }
        }
        .padding()
    }
}

private func colorSwatch(_ color: Color, _ name: String) -> some View {
    VStack {
        RoundedRectangle(cornerRadius: 12)
            .fill(color)
            .frame(width: 70, height: 70)
            .shadow(radius: 4)

        Text(name)
            .font(.caption)
    }
}
