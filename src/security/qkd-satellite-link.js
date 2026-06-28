/**
 * qkd-satellite-link.js V2.7
 */

export class QKDSatelliteLink {
    constructor() {
        this.satAzimuth = 120.0;     
        this.satElevation = 5.0;     
        this.secureKeyRateBps = 0;   
        this.qber = 0.015;           
        this.isInterceptionDetected = false;
    }

    updateLinkDynamics(elapsedSeconds, currentPhase, isMitMActive) {

        if (currentPhase !== 'STANDBY' && currentPhase !== 'MISSION_COMPLETE') {
            this.satElevation += 0.45; 
            this.satAzimuth = (120.0 + (elapsedSeconds * 0.8)) % 360;
            if (this.satElevation > 85.0) this.satElevation = 85.0; 
        }

        let atmosphericAttenuation = Math.max(0.01, (90.0 - this.satElevation) * 0.0005);

        let quantumJitter = Math.abs(Math.random() - 0.5) * 0.01;
        
        this.qber = 0.012 + atmosphericAttenuation + quantumJitter;
    }
}