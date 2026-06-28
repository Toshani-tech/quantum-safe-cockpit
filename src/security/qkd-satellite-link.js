/**
 * qkd-satellite-link.js
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
    }
}