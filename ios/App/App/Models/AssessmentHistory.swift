import Foundation

struct AssessmentGameResult: Codable, Equatable {
    let gameType: String
    let domain: String
    let correct: Int
    let wrong: Int
    let avgResponseMs: Int
    let peakTier: Int
}

struct AssessmentResult: Codable, Equatable {
    let date: String
    let type: String
    let duration: Int
    let compositeScore: Double
    let domainScores: [String: DomainScore]
    let gameResults: [AssessmentGameResult]
    let totalCorrect: Int
    let totalWrong: Int
    let classificationLevel: String
}

struct AssessmentHistory: Codable, Equatable {
    var results: [AssessmentResult]

    static let `default` = AssessmentHistory(results: [])

    mutating func addResult(_ result: AssessmentResult) {
        results.append(result)
        if results.count > 52 {
            results.removeFirst(results.count - 52)
        }
    }

    var latestImprovement: Double? {
        guard results.count >= 2 else { return nil }
        let latest = results[results.count - 1].compositeScore
        let previous = results[results.count - 2].compositeScore
        guard previous > 0 else { return nil }
        return ((latest - previous) / previous) * 100
    }

    func domainTrend(_ domain: String) -> Double? {
        guard results.count >= 2 else { return nil }
        let latest = results[results.count - 1].domainScores[domain]?.score ?? 0
        let previous = results[results.count - 2].domainScores[domain]?.score ?? 0
        guard previous > 0 else { return nil }
        return ((latest - previous) / previous) * 100
    }

    // Migration-safe decoder
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        results = try container.decodeIfPresent([AssessmentResult].self, forKey: .results) ?? []
    }

    init(results: [AssessmentResult]) {
        self.results = results
    }
}
