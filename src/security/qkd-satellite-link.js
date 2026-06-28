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
        // 1. Simulate Satellite Moving Across the Sky (Orbital Mechanics)
        if (currentPhase !== 'STANDBY' && currentPhase !== 'MISSION_COMPLETE') {
            this.satElevation += 0.45; 
            this.satAzimuth = (120.0 + (elapsedSeconds * 0.8)) % 360;
            if (this.satElevation > 85.0) this.satElevation = 85.0; 
        }

       
        let atmosphericAttenuation = Math.max(0.01, (90.0 - this.satElevation) * 0.0005);

        if (isMitMActive || currentPhase === 'ENGAGEMENT_ZONE') {
           
            this.qber = 0.22 + (Math.random() * 0.04); 
            this.secureKeyRateBps = 0; 
            this.isInterceptionDetected = true;
        } else {
    
            this.isInterceptionDetected = false;
            let quantumJitter = Math.abs(Math.random() - 0.5) * 0.01;
            this.qber = 0.012 + atmosphericAttenuation + quantumJitter;
            
    
            if (this.satElevation > 10) {
                this.secureKeyRateBps = Math.round(1200 + (this.satElevation * 15.5) + (Math.random() * 50));
            } else {
                this.secureKeyRateBps = 0; 
            }
        }
    }
}