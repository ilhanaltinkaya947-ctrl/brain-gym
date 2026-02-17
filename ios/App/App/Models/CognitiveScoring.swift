import Foundation

enum CognitiveScoring {

    static let domainMapping: [String: String] = [
        "speedMath": "math",
        "operatorChaos": "math",
        "colorMatch": "reaction",
        "paradoxFlow": "logic",
        "suitDeception": "perception",
        "patternHunter": "perception",
        "chimpMemory": "memory",
        "flashMemory": "memory",
        "spatialStack": "spatial",
        "wordConnect": "linguistic",
    ]

    static let domainWeights: [String: Double] = [
        "memory": 2.0,
        "math": 2.0,
        "perception": 2.0,
        "reaction": 1.0,
        "logic": 1.0,
        "spatial": 1.0,
        "linguistic": 1.0,
    ]

    static func calculateDomainScore(
        correct: Int, wrong: Int,
        avgResponseMs: Int, questionsAnswered: Int, peakTier: Int
    ) -> DomainScore {
        let total = correct + wrong
        guard total > 0 else { return .zero }

        let accuracy = Double(correct) / Double(total)
        let baseAccuracy = accuracy * 600.0
        let tierBonus = 1.0 + Double(max(1, peakTier) - 1) * 0.15
        // Neutral speedBonus (1.0) when response time not tracked
        let speedBonus = avgResponseMs > 0
            ? min(1.2, max(0.8, 1.0 + Double(2000 - avgResponseMs) / 5000.0))
            : 1.0
        let volumeBonus = min(1.0, Double(questionsAnswered) / 5.0)

        let raw = baseAccuracy * tierBonus * speedBonus * volumeBonus
        let score = min(1000.0, max(0.0, raw))

        return DomainScore(
            score: score,
            accuracy: accuracy,
            avgResponseMs: avgResponseMs,
            questionsAnswered: questionsAnswered,
            peakTier: peakTier
        )
    }

    static func calculateComposite(_ domainScores: [String: DomainScore]) -> Double {
        var weightedSum = 0.0
        var totalWeight = 0.0

        for domain in CognitiveDomain.allCases {
            let key = domain.rawValue
            let score = domainScores[key]?.score ?? 0
            let weight = domainWeights[key] ?? 1.0
            weightedSum += score * weight
            totalWeight += weight
        }

        guard totalWeight > 0 else { return 0 }
        return weightedSum / totalWeight
    }

    static func classification(for composite: Double) -> String {
        switch composite {
        case 0..<150: return "beginner"
        case 150..<350: return "developing"
        case 350..<550: return "intermediate"
        case 550..<750: return "advanced"
        default: return "elite"
        }
    }
}
