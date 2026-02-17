import Foundation

enum CognitiveDomain: String, Codable, CaseIterable {
    case memory
    case math
    case reaction
    case logic
    case perception
    case spatial
    case linguistic
}

struct DomainScore: Codable, Equatable {
    var score: Double
    var accuracy: Double
    var avgResponseMs: Int
    var questionsAnswered: Int
    var peakTier: Int

    static let zero = DomainScore(
        score: 0, accuracy: 0, avgResponseMs: 0,
        questionsAnswered: 0, peakTier: 1
    )
}

struct CognitiveProfile: Codable, Equatable {
    var domainScores: [String: DomainScore]
    var compositeScore: Double
    var classificationLevel: String
    var lastAssessmentDate: String?
    var lastWeeklyDate: String?
    var assessmentCount: Int
    var baselineComplete: Bool

    var recommendedStartTier: Int {
        switch compositeScore {
        case 0..<150: return 1
        case 150..<350: return 2
        case 350..<550: return 3
        case 550..<750: return 4
        default: return 5
        }
    }

    static let `default` = CognitiveProfile(
        domainScores: Dictionary(
            uniqueKeysWithValues: CognitiveDomain.allCases.map {
                ($0.rawValue, DomainScore.zero)
            }
        ),
        compositeScore: 0,
        classificationLevel: "beginner",
        lastAssessmentDate: nil,
        lastWeeklyDate: nil,
        assessmentCount: 0,
        baselineComplete: false
    )

    // Migration-safe decoder
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let saved = try container.decodeIfPresent([String: DomainScore].self, forKey: .domainScores) ?? [:]
        var scores: [String: DomainScore] = [:]
        for domain in CognitiveDomain.allCases {
            scores[domain.rawValue] = saved[domain.rawValue] ?? .zero
        }
        domainScores = scores
        compositeScore = try container.decodeIfPresent(Double.self, forKey: .compositeScore) ?? 0
        classificationLevel = try container.decodeIfPresent(String.self, forKey: .classificationLevel) ?? "beginner"
        lastAssessmentDate = try container.decodeIfPresent(String.self, forKey: .lastAssessmentDate)
        lastWeeklyDate = try container.decodeIfPresent(String.self, forKey: .lastWeeklyDate)
        assessmentCount = try container.decodeIfPresent(Int.self, forKey: .assessmentCount) ?? 0
        baselineComplete = try container.decodeIfPresent(Bool.self, forKey: .baselineComplete) ?? false
    }

    init(
        domainScores: [String: DomainScore], compositeScore: Double,
        classificationLevel: String, lastAssessmentDate: String?,
        lastWeeklyDate: String?, assessmentCount: Int, baselineComplete: Bool
    ) {
        self.domainScores = domainScores
        self.compositeScore = compositeScore
        self.classificationLevel = classificationLevel
        self.lastAssessmentDate = lastAssessmentDate
        self.lastWeeklyDate = lastWeeklyDate
        self.assessmentCount = assessmentCount
        self.baselineComplete = baselineComplete
    }
}
