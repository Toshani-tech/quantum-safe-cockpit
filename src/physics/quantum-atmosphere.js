// quantum-atmosphere.js - V1.2 

export class QuantumAtmosphereLink {
    constructor() {
       
        this.PLANCK_CONSTANT = 6.626e-34;
        this.SPEED_OF_LIGHT = 3e8;
        this.LASER_WAVELENGTH = 810e-9; 
        
    
        this.satElevation = 10.0; 
        this.satAzimuth = 145.0;
        this.orbitalSpeed = 0.8;  
        }

    calculateTransmittance(aircraftAltitudeFt) {
        
        const h = aircraftAltitudeFt * 0.3048;
        const thetaRad = (this.satElevation * Math.PI) / 180.0;
        const airmass = 1.0 / Math.max(0.01, Math.sin(thetaRad));
        const alpha0 = 1.2e-4; 
        const scaleHeight = 8000;
        const opticalDepth = alpha0 * scaleHeight * Math.exp(-h / scaleHeight);
        const transmittance = Math.exp(-opticalDepth * airmass);
        return Math.max(0.01, Math.min(1.0, transmittance));
    }