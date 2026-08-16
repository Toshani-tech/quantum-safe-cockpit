#ifndef AUDITOR_ENGINE_HPP
#define AUDITOR_ENGINE_HPP

#include <string>
#include <vector>

struct FlightRecord {
    int t;
    int alt;
    int spd;
    std::string phase;
    double lat;
};

struct AuditResult {
    int total_records;
    double peak_latency;
    int max_altitude;
    int max_airspeed;
    std::string verdict;
};

class AuditorEngine {
public:
    AuditResult analyzeLogs(const std::vector<FlightRecord>& records);
};

#endif