import AVFoundation

final class SoundService {
    static let shared = SoundService()

    private let engine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private let format: AVAudioFormat
    private let masterVolume: Float = 0.25

    private var isSoundEnabled: Bool {
        guard let data = UserDefaults.standard.data(forKey: "axon-settings"),
              let settings = try? JSONDecoder().decode(AppSettings.self, from: data) else {
            return true // default to enabled if no settings saved
        }
        return settings.soundEnabled
    }

    private var stopWorkItem: DispatchWorkItem?

    private init() {
        format = AVAudioFormat(standardFormatWithSampleRate: 44100, channels: 2)!
        engine.attach(playerNode)
        engine.connect(playerNode, to: engine.mainMixerNode, format: format)

        // Configure audio session for mixing with other audio
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.ambient, mode: .default, options: [.mixWithOthers])
        try? session.setActive(true)
        // Engine starts on-demand in playBuffer, not here — avoids constant white noise
    }

    // MARK: - Buffer Generation

    private func generateBuffer(
        duration: Double,
        generator: (_ frame: Int, _ t: Double, _ progress: Double) -> (Float, Float)
    ) -> AVAudioPCMBuffer {
        let sampleRate = format.sampleRate
        let frameCount = AVAudioFrameCount(duration * sampleRate)
        let buffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount)!
        buffer.frameLength = frameCount

        let leftChannel = buffer.floatChannelData![0]
        let rightChannel = buffer.floatChannelData![1]

        for frame in 0..<Int(frameCount) {
            let t = Double(frame) / sampleRate
            let progress = t / duration
            let (l, r) = generator(frame, t, progress)
            leftChannel[frame] = l * masterVolume
            rightChannel[frame] = r * masterVolume
        }
        return buffer
    }

    private func playBuffer(_ buffer: AVAudioPCMBuffer) {
        // Cancel any pending engine stop
        stopWorkItem?.cancel()
        stopWorkItem = nil

        if !engine.isRunning {
            try? engine.start()
        }
        playerNode.stop()
        playerNode.scheduleBuffer(buffer) { [weak self] in
            // Stop engine after playback + small buffer to avoid cutting tail
            let work = DispatchWorkItem { [weak self] in
                self?.playerNode.stop()
                self?.engine.stop()
            }
            self?.stopWorkItem = work
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.1, execute: work)
        }
        playerNode.play()
    }

    // MARK: - Helpers

    private func sin2pi(_ freq: Double, _ t: Double) -> Double {
        sin(2.0 * .pi * freq * t)
    }

    /// Simple attack-decay envelope (no sustain)
    private func attackDecay(progress: Double, attackEnd: Double) -> Double {
        if progress < attackEnd {
            return progress / attackEnd
        } else {
            let decayProgress = (progress - attackEnd) / (1.0 - attackEnd)
            // Exponential decay for natural sound
            return max(0.0, pow(1.0 - decayProgress, 2.0))
        }
    }

    // MARK: - Sound Types

    /// Dramatic activation swell. Deep binaural swell (110Hz L, 113.5Hz R = 3.5Hz delta beat)
    /// ramping up over 600ms with crystalline harmonics (330Hz, 440Hz, 660Hz) blooming at peak.
    /// Total 800ms. The MOST impactful sound.
    func playStartTraining() {
        guard isSoundEnabled else { return }

        let buffer = generateBuffer(duration: 0.8) { [self] _, t, progress in
            // Envelope: swell up over 600ms (75%), then rapid decay
            let envelope: Double
            if progress < 0.75 {
                // Smooth ramp up with exponential curve
                let rampProgress = progress / 0.75
                envelope = rampProgress * rampProgress
            } else {
                // Quick decay
                let decayProgress = (progress - 0.75) / 0.25
                envelope = max(0.0, 1.0 - decayProgress * decayProgress)
            }

            // Base binaural: 110Hz L, 113.5Hz R (3.5Hz delta beat)
            let baseL = sin2pi(110.0, t)
            let baseR = sin2pi(113.5, t)

            // Crystalline harmonics bloom at the peak (progress > 0.4)
            let harmonicEnvelope = max(0.0, min(1.0, (progress - 0.4) / 0.35))
            let harm1 = sin2pi(330.0, t) * 0.3 * harmonicEnvelope
            let harm2 = sin2pi(440.0, t) * 0.25 * harmonicEnvelope
            let harm3 = sin2pi(660.0, t) * 0.15 * harmonicEnvelope

            let left = Float((baseL + harm1 + harm2 + harm3) * envelope * 0.5)
            let right = Float((baseR + harm1 + harm2 + harm3) * envelope * 0.5)

            return (left, right)
        }
        playBuffer(buffer)
    }

    /// Metronomic binaural pulse. Two quick 528Hz pings 150ms apart with 14Hz Beta offset
    /// (528L, 542R). Crisp, precise, timed feel. 80ms per ping with 200ms total.
    func playClassicProtocol() {
        guard isSoundEnabled else { return }

        let buffer = generateBuffer(duration: 0.23) { [self] _, t, _ in
            // Ping 1: 0ms - 80ms
            // Ping 2: 150ms - 230ms
            let ping1Active = t < 0.08
            let ping2Active = t >= 0.15 && t < 0.23

            var left: Double = 0.0
            var right: Double = 0.0

            if ping1Active {
                let pingProgress = t / 0.08
                // Sharp attack, quick decay
                let env = pingProgress < 0.05 ? (pingProgress / 0.05) : max(0.0, 1.0 - ((pingProgress - 0.05) / 0.95))
                left = sin2pi(528.0, t) * env
                right = sin2pi(542.0, t) * env
            }

            if ping2Active {
                let localT = t - 0.15
                let pingProgress = localT / 0.08
                let env = pingProgress < 0.05 ? (pingProgress / 0.05) : max(0.0, 1.0 - ((pingProgress - 0.05) / 0.95))
                left += sin2pi(528.0, t) * env
                right += sin2pi(542.0, t) * env
            }

            return (Float(left * 0.6), Float(right * 0.6))
        }
        playBuffer(buffer)
    }

    /// Open sustaining tone. 220Hz with 3Hz Alpha offset (220L, 223R), slow 200ms attack,
    /// long 1.2s sustain+decay. No clear ending -- fades into silence. Feels infinite.
    func playEndlessProtocol() {
        guard isSoundEnabled else { return }

        let totalDuration = 1.4
        let buffer = generateBuffer(duration: totalDuration) { [self] _, t, progress in
            // 200ms attack, then long exponential fade
            let attackEnd = 0.2 / totalDuration
            let envelope: Double
            if progress < attackEnd {
                // Smooth attack
                let ramp = progress / attackEnd
                envelope = ramp * ramp // quadratic for smooth onset
            } else {
                // Very slow exponential decay -- feels infinite
                let decayProgress = (progress - attackEnd) / (1.0 - attackEnd)
                envelope = pow(1.0 - decayProgress, 3.0)
            }

            let left = sin2pi(220.0, t) * envelope
            let right = sin2pi(223.0, t) * envelope

            return (Float(left * 0.5), Float(right * 0.5))
        }
        playBuffer(buffer)
    }

    /// Gentle theta chime. 396Hz (solfeggio) with 4Hz Theta offset. Soft 20ms attack, 400ms decay.
    /// Warm, inviting.
    func playDifficultyEasy() {
        guard isSoundEnabled else { return }

        let totalDuration = 0.42
        let buffer = generateBuffer(duration: totalDuration) { [self] _, t, progress in
            let attackEnd = 0.02 / totalDuration
            let envelope = attackDecay(progress: progress, attackEnd: attackEnd)

            let left = sin2pi(396.0, t) * envelope
            let right = sin2pi(400.0, t) * envelope

            return (Float(left * 0.5), Float(right * 0.5))
        }
        playBuffer(buffer)
    }

    /// Alpha wave with sharper attack. 528Hz with 10Hz Alpha offset. 5ms attack, 300ms decay.
    /// Brighter and more alert.
    func playDifficultyMedium() {
        guard isSoundEnabled else { return }

        let totalDuration = 0.305
        let buffer = generateBuffer(duration: totalDuration) { [self] _, t, progress in
            let attackEnd = 0.005 / totalDuration
            let envelope = attackDecay(progress: progress, attackEnd: attackEnd)

            let left = sin2pi(528.0, t) * envelope
            let right = sin2pi(538.0, t) * envelope

            return (Float(left * 0.55), Float(right * 0.55))
        }
        playBuffer(buffer)
    }

    /// Beta/gamma with fast pulse. 741Hz with 18Hz Beta offset. 2ms attack, 200ms decay.
    /// Second harmonic at 1482Hz. Intense, urgent.
    func playDifficultyHard() {
        guard isSoundEnabled else { return }

        let totalDuration = 0.202
        let buffer = generateBuffer(duration: totalDuration) { [self] _, t, progress in
            let attackEnd = 0.002 / totalDuration
            let envelope = attackDecay(progress: progress, attackEnd: attackEnd)

            // Fundamental
            let fundL = sin2pi(741.0, t)
            let fundR = sin2pi(759.0, t) // 741 + 18

            // Second harmonic at 1482Hz
            let harmL = sin2pi(1482.0, t) * 0.35
            let harmR = sin2pi(1500.0, t) * 0.35 // 1482 + 18

            let left = (fundL + harmL) * envelope
            let right = (fundR + harmR) * envelope

            return (Float(left * 0.45), Float(right * 0.45))
        }
        playBuffer(buffer)
    }
}
