// MARK: - PrayerTimeService.swift
// Noor - Premium Islamic Companion App
// Copyright (c) 2026. All rights reserved.

import Foundation
import CoreLocation
import Combine

// MARK: - Prayer Time Service Protocol

/// Protocol defining prayer time calculation service
public protocol PrayerTimeServiceProtocol {
    /// Calculate prayer times for a specific date and location
    func calculatePrayerTimes(for date: Date, at location: PrayerLocation, settings: PrayerSettings) -> PrayerTimes

    /// Calculate prayer times for a date range
    func calculatePrayerTimes(from startDate: Date, to endDate: Date, at location: PrayerLocation, settings: PrayerSettings) -> [PrayerTimes]

    /// Calculate qibla direction from a location
    func calculateQiblaDirection(from location: PrayerLocation) -> QiblaDirection

    /// Get the current or next prayer
    func getCurrentOrNextPrayer(at location: PrayerLocation, settings: PrayerSettings) -> (type: PrayerType, time: Date, isOngoing: Bool)?
}

// MARK: - Prayer Time Service Implementation

/// High-precision prayer time calculation service
/// Uses astronomical calculations with U2 chip precision location data
public final class PrayerTimeService: PrayerTimeServiceProtocol {

    // MARK: - Constants

    private enum Constants {
        // Ka'bah coordinates
        static let kaabahLatitude = 21.4225
        static let kaabahLongitude = 39.8262

        // Earth's obliquity (degrees)
        static let earthObliquity = 23.4397

        // Atmospheric refraction at sunrise/sunset (degrees)
        static let atmosphericRefraction = 0.833

        // Sun's apparent radius (degrees)
        static let sunApparentRadius = 0.266
    }

    // MARK: - Initialization

    public init() {}

    // MARK: - Prayer Time Calculation

    public func calculatePrayerTimes(
        for date: Date,
        at location: PrayerLocation,
        settings: PrayerSettings
    ) -> PrayerTimes {
        let calendar = Calendar(identifier: .gregorian)
        let components = calendar.dateComponents(in: location.timezone, from: date)

        guard let year = components.year,
              let month = components.month,
              let day = components.day else {
            fatalError("Invalid date components")
        }

        // Calculate Julian date
        let julianDate = calculateJulianDate(year: year, month: month, day: day)

        // Calculate sun position
        let sunPosition = calculateSunPosition(julianDate: julianDate)

        // Calculate prayer times
        let times = calculateAllPrayerTimes(
            date: date,
            location: location,
            settings: settings,
            sunPosition: sunPosition,
            julianDate: julianDate
        )

        return times
    }

    public func calculatePrayerTimes(
        from startDate: Date,
        to endDate: Date,
        at location: PrayerLocation,
        settings: PrayerSettings
    ) -> [PrayerTimes] {
        var prayerTimesList: [PrayerTimes] = []
        var currentDate = startDate
        let calendar = Calendar.current

        while currentDate <= endDate {
            let times = calculatePrayerTimes(for: currentDate, at: location, settings: settings)
            prayerTimesList.append(times)
            guard let nextDate = calendar.date(byAdding: .day, value: 1, to: currentDate) else { break }
            currentDate = nextDate
        }

        return prayerTimesList
    }

    public func getCurrentOrNextPrayer(
        at location: PrayerLocation,
        settings: PrayerSettings
    ) -> (type: PrayerType, time: Date, isOngoing: Bool)? {
        let today = calculatePrayerTimes(for: Date(), at: location, settings: settings)
        return today.currentOrNextPrayer()
    }

    // MARK: - Qibla Direction Calculation

    public func calculateQiblaDirection(from location: PrayerLocation) -> QiblaDirection {
        let lat1 = toRadians(location.latitude)
        let lon1 = toRadians(location.longitude)
        let lat2 = toRadians(Constants.kaabahLatitude)
        let lon2 = toRadians(Constants.kaabahLongitude)

        let deltaLon = lon2 - lon1

        // Calculate bearing using spherical trigonometry
        let x = sin(deltaLon) * cos(lat2)
        let y = cos(lat1) * sin(lat2) - sin(lat1) * cos(lat2) * cos(deltaLon)

        var bearing = toDegrees(atan2(x, y))
        bearing = (bearing + 360).truncatingRemainder(dividingBy: 360)

        // Calculate distance using Haversine formula
        let dLat = lat2 - lat1
        let dLon = deltaLon

        let a = sin(dLat / 2) * sin(dLat / 2) +
                cos(lat1) * cos(lat2) *
                sin(dLon / 2) * sin(dLon / 2)
        let c = 2 * atan2(sqrt(a), sqrt(1 - a))
        let earthRadius = 6371.0 // km
        let distance = earthRadius * c

        return QiblaDirection(bearing: bearing, distance: distance)
    }

    // MARK: - Private Calculation Methods

    private func calculateJulianDate(year: Int, month: Int, day: Int) -> Double {
        var y = year
        var m = month

        if m <= 2 {
            y -= 1
            m += 12
        }

        let a = Int(Double(y) / 100.0)
        let b = 2 - a + Int(Double(a) / 4.0)

        return Double(Int(365.25 * Double(y + 4716))) +
               Double(Int(30.6001 * Double(m + 1))) +
               Double(day) + Double(b) - 1524.5
    }

    private struct SunPosition {
        let declination: Double // degrees
        let equationOfTime: Double // minutes
    }

    private func calculateSunPosition(julianDate: Double) -> SunPosition {
        let d = julianDate - 2451545.0 // Days since J2000.0

        // Mean longitude of the Sun
        let meanLongitude = (280.46646 + 0.9856474 * d).truncatingRemainder(dividingBy: 360)

        // Mean anomaly of the Sun
        let meanAnomaly = (357.52911 + 0.98560028 * d).truncatingRemainder(dividingBy: 360)
        let meanAnomalyRad = toRadians(meanAnomaly)

        // Equation of center
        let center = 1.9148 * sin(meanAnomalyRad) +
                     0.02 * sin(2 * meanAnomalyRad) +
                     0.0003 * sin(3 * meanAnomalyRad)

        // True longitude
        let trueLongitude = meanLongitude + center

        // Apparent longitude (corrected for nutation and aberration)
        let omega = 125.04 - 0.052954 * d
        let apparentLongitude = trueLongitude - 0.00569 - 0.00478 * sin(toRadians(omega))

        // Obliquity of the ecliptic
        let obliquity = Constants.earthObliquity - 0.00000036 * d

        // Sun's declination
        let declination = toDegrees(asin(sin(toRadians(obliquity)) * sin(toRadians(apparentLongitude))))

        // Equation of time
        let y = pow(tan(toRadians(obliquity / 2)), 2)
        let eot = 4 * toDegrees(
            y * sin(2 * toRadians(meanLongitude)) -
            2 * 0.0167 * sin(meanAnomalyRad) +
            4 * 0.0167 * y * sin(meanAnomalyRad) * cos(2 * toRadians(meanLongitude)) -
            0.5 * y * y * sin(4 * toRadians(meanLongitude)) -
            1.25 * 0.0167 * 0.0167 * sin(2 * meanAnomalyRad)
        )

        return SunPosition(declination: declination, equationOfTime: eot)
    }

    private func calculateAllPrayerTimes(
        date: Date,
        location: PrayerLocation,
        settings: PrayerSettings,
        sunPosition: SunPosition,
        julianDate: Double
    ) -> PrayerTimes {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)

        // Calculate transit (solar noon / Dhuhr base)
        let transit = 12.0 + (-location.longitude / 15.0) - (sunPosition.equationOfTime / 60.0)

        // Calculate sunrise and sunset
        let sunriseAngle = Constants.atmosphericRefraction + Constants.sunApparentRadius
        let sunriseOffset = calculateHourAngle(
            latitude: location.latitude,
            declination: sunPosition.declination,
            angle: sunriseAngle
        )

        let sunrise = transit - (sunriseOffset / 15.0)
        let sunset = transit + (sunriseOffset / 15.0)

        // Calculate Fajr
        let fajrAngle = settings.calculationMethod.fajrAngle
        let fajrOffset = calculateHourAngle(
            latitude: location.latitude,
            declination: sunPosition.declination,
            angle: fajrAngle
        )
        var fajr = transit - (fajrOffset / 15.0)

        // Calculate Isha
        var isha: Double
        let ishaParams = settings.calculationMethod.ishaParameter
        if let ishaAngle = ishaParams.angle {
            let ishaOffset = calculateHourAngle(
                latitude: location.latitude,
                declination: sunPosition.declination,
                angle: ishaAngle
            )
            isha = transit + (ishaOffset / 15.0)
        } else if let minutesAfter = ishaParams.minutesAfterMaghrib {
            isha = sunset + (Double(minutesAfter) / 60.0)
        } else {
            isha = sunset + 1.5 // Default fallback
        }

        // Calculate Asr
        let asr = calculateAsrTime(
            transit: transit,
            latitude: location.latitude,
            declination: sunPosition.declination,
            method: settings.asrMethod
        )

        // Apply high latitude adjustments if needed
        if abs(location.latitude) > 48 {
            let adjustedTimes = applyHighLatitudeAdjustment(
                fajr: fajr,
                sunrise: sunrise,
                sunset: sunset,
                isha: isha,
                method: settings.highLatitudeMethod
            )
            fajr = adjustedTimes.fajr
            isha = adjustedTimes.isha
        }

        // Apply manual adjustments
        fajr += Double(settings.manualAdjustments[.fajr] ?? 0) / 60.0
        let dhuhr = transit + Double(settings.manualAdjustments[.dhuhr] ?? 0) / 60.0
        let adjustedAsr = asr + Double(settings.manualAdjustments[.asr] ?? 0) / 60.0
        let maghrib = sunset + Double(settings.manualAdjustments[.maghrib] ?? 0) / 60.0
        isha += Double(settings.manualAdjustments[.isha] ?? 0) / 60.0

        // Convert to Date objects
        let fajrDate = timeToDate(hours: fajr, baseDate: startOfDay, timezone: location.timezone)
        let sunriseDate = timeToDate(hours: sunrise, baseDate: startOfDay, timezone: location.timezone)
        let dhuhrDate = timeToDate(hours: dhuhr, baseDate: startOfDay, timezone: location.timezone)
        let asrDate = timeToDate(hours: adjustedAsr, baseDate: startOfDay, timezone: location.timezone)
        let maghribDate = timeToDate(hours: maghrib, baseDate: startOfDay, timezone: location.timezone)
        let ishaDate = timeToDate(hours: isha, baseDate: startOfDay, timezone: location.timezone)

        // Calculate additional times
        let midnight = calculateMidnight(sunset: sunset, nextFajr: fajr + 24)
        let midnightDate = timeToDate(hours: midnight, baseDate: startOfDay, timezone: location.timezone)

        let lastThird = calculateLastThirdOfNight(sunset: sunset, nextFajr: fajr + 24)
        let lastThirdDate = timeToDate(hours: lastThird, baseDate: startOfDay, timezone: location.timezone)

        let imsak = fajr - (10.0 / 60.0) // 10 minutes before Fajr
        let imsakDate = timeToDate(hours: imsak, baseDate: startOfDay, timezone: location.timezone)

        return PrayerTimes(
            date: date,
            location: location,
            calculationMethod: settings.calculationMethod,
            asrMethod: settings.asrMethod,
            fajr: fajrDate,
            sunrise: sunriseDate,
            dhuhr: dhuhrDate,
            asr: asrDate,
            maghrib: maghribDate,
            isha: ishaDate,
            midnight: midnightDate,
            lastThirdOfNight: lastThirdDate,
            imsak: imsakDate
        )
    }

    private func calculateHourAngle(latitude: Double, declination: Double, angle: Double) -> Double {
        let latRad = toRadians(latitude)
        let decRad = toRadians(declination)
        let angleRad = toRadians(angle)

        let cosH = (-sin(angleRad) - sin(latRad) * sin(decRad)) /
                   (cos(latRad) * cos(decRad))

        // Clamp to valid range
        let clampedCosH = max(-1, min(1, cosH))

        return toDegrees(acos(clampedCosH))
    }

    private func calculateAsrTime(transit: Double, latitude: Double, declination: Double, method: AsrJuristicMethod) -> Double {
        let latRad = toRadians(latitude)
        let decRad = toRadians(declination)

        // Shadow factor based on juristic method
        let factor = method.shadowFactor

        // Calculate the angle when shadow = factor * object length + noon shadow
        let a = atan(1.0 / (factor + tan(abs(latRad - decRad))))
        let angle = toDegrees(a)

        // Calculate hour angle for Asr
        let cosH = (sin(toRadians(90 - angle)) - sin(latRad) * sin(decRad)) /
                   (cos(latRad) * cos(decRad))

        let clampedCosH = max(-1, min(1, cosH))
        let hourAngle = toDegrees(acos(clampedCosH))

        return transit + (hourAngle / 15.0)
    }

    private func applyHighLatitudeAdjustment(
        fajr: Double,
        sunrise: Double,
        sunset: Double,
        isha: Double,
        method: HighLatitudeMethod
    ) -> (fajr: Double, isha: Double) {
        let nightDuration = 24 - (sunset - sunrise)

        switch method {
        case .none:
            return (fajr, isha)

        case .nightMiddle:
            let halfNight = nightDuration / 2
            let adjustedFajr = max(fajr, sunrise - halfNight)
            let adjustedIsha = min(isha, sunset + halfNight)
            return (adjustedFajr, adjustedIsha)

        case .oneSeventh:
            let seventh = nightDuration / 7
            let adjustedFajr = max(fajr, sunrise - seventh)
            let adjustedIsha = min(isha, sunset + seventh)
            return (adjustedFajr, adjustedIsha)

        case .angleBased:
            let fajrPortion = 1.0 / 60.0 * abs(fajr - sunrise) * 15.0
            let ishaPortion = 1.0 / 60.0 * abs(isha - sunset) * 15.0
            let adjustedFajr = sunrise - fajrPortion * nightDuration
            let adjustedIsha = sunset + ishaPortion * nightDuration
            return (adjustedFajr, adjustedIsha)
        }
    }

    private func calculateMidnight(sunset: Double, nextFajr: Double) -> Double {
        return sunset + (nextFajr - sunset) / 2
    }

    private func calculateLastThirdOfNight(sunset: Double, nextFajr: Double) -> Double {
        let nightDuration = nextFajr - sunset
        return sunset + (2 * nightDuration / 3)
    }

    private func timeToDate(hours: Double, baseDate: Date, timezone: TimeZone) -> Date {
        let totalSeconds = hours * 3600
        var calendar = Calendar.current
        calendar.timeZone = timezone
        return calendar.date(byAdding: .second, value: Int(totalSeconds), to: baseDate) ?? baseDate
    }

    // MARK: - Helper Functions

    private func toRadians(_ degrees: Double) -> Double {
        return degrees * .pi / 180.0
    }

    private func toDegrees(_ radians: Double) -> Double {
        return radians * 180.0 / .pi
    }
}

// MARK: - Prayer Time Service Provider

/// Singleton provider for prayer time service with caching
public final class PrayerTimeServiceProvider: @unchecked Sendable {
    public static let shared = PrayerTimeServiceProvider()

    private let service: PrayerTimeService
    private var cache: [String: PrayerTimes] = [:]
    private let cacheQueue = DispatchQueue(label: "com.noor.prayertimecache")

    private init() {
        self.service = PrayerTimeService()
    }

    /// Get prayer times with caching
    public func getPrayerTimes(
        for date: Date,
        at location: PrayerLocation,
        settings: PrayerSettings
    ) -> PrayerTimes {
        let cacheKey = generateCacheKey(date: date, location: location, settings: settings)

        return cacheQueue.sync {
            if let cached = cache[cacheKey] {
                return cached
            }

            let times = service.calculatePrayerTimes(for: date, at: location, settings: settings)
            cache[cacheKey] = times
            return times
        }
    }

    /// Get qibla direction (no caching needed, calculation is fast)
    public func getQiblaDirection(from location: PrayerLocation) -> QiblaDirection {
        return service.calculateQiblaDirection(from: location)
    }

    /// Clear cache (call when settings change)
    public func clearCache() {
        cacheQueue.async { [weak self] in
            self?.cache.removeAll()
        }
    }

    private func generateCacheKey(date: Date, location: PrayerLocation, settings: PrayerSettings) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: date)
        let locationKey = "\(location.latitude.rounded(toPlaces: 4))_\(location.longitude.rounded(toPlaces: 4))"
        let settingsKey = "\(settings.calculationMethod.rawValue)_\(settings.asrMethod.rawValue)"
        return "\(dateString)_\(locationKey)_\(settingsKey)"
    }
}

// MARK: - Double Extension for Rounding

private extension Double {
    func rounded(toPlaces places: Int) -> Double {
        let divisor = pow(10.0, Double(places))
        return (self * divisor).rounded() / divisor
    }
}
