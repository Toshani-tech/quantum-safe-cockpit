#define PY_SSIZE_T_CLEAN
#include <Python.h>
#include "auditor-engine.hpp"
#include <vector>

static PyObject* py_analyze_logs(PyObject* self, PyObject* args) {
    PyObject* list_obj;
    if (!PyArg_ParseTuple(args, "O!", &PyList_Type, &list_obj)) {
        return NULL;
    }

    std::vector<FlightRecord> records;
    Py_ssize_t size = PyList_Size(list_obj);
    
    for (Py_ssize_t i = 0; i < size; i++) {
        PyObject* item = PyList_GetItem(list_obj, i);
        if (!PyDict_Check(item)) continue;

        FlightRecord r;
        PyObject* val_t = PyDict_GetItemString(item, "t");
        r.t = val_t ? (int)PyLong_AsLong(val_t) : 0;

        PyObject* val_alt = PyDict_GetItemString(item, "alt");
        r.alt = val_alt ? (int)PyLong_AsLong(val_alt) : 0;

        PyObject* val_spd = PyDict_GetItemString(item, "spd");
        r.spd = val_spd ? (int)PyLong_AsLong(val_spd) : 0;

        PyObject* val_lat = PyDict_GetItemString(item, "lat");
        r.lat = val_lat ? PyFloat_AsDouble(val_lat) : 0.0;

        PyObject* val_phase = PyDict_GetItemString(item, "phase");
        if (val_phase && PyUnicode_Check(val_phase)) {
            r.phase = PyUnicode_AsUTF8(val_phase);
        } else {
            r.phase = "N/A";
        }

        records.push_back(r);
    }

    AuditorEngine engine;
    AuditResult res = engine.analyzeLogs(records);

    PyObject* dict = PyDict_New();
    PyDict_SetItemString(dict, "total_records", PyLong_FromLong(res.total_records));
    PyDict_SetItemString(dict, "peak_latency", PyFloat_FromDouble(res.peak_latency));
    PyDict_SetItemString(dict, "max_altitude", PyLong_FromLong(res.max_altitude));
    PyDict_SetItemString(dict, "max_airspeed", PyLong_FromLong(res.max_airspeed));
    PyDict_SetItemString(dict, "verdict", PyUnicode_FromString(res.verdict.c_str()));

    return dict;
}

static PyMethodDef AuditorMethods[] = {
    {"analyze_flight_data", py_analyze_logs, METH_VARARGS, "Analyze flight logs using C++ engine."},
    {NULL, NULL, 0, NULL}
};

static struct PyModuleDef auditormodule = {
    PyModuleDef_HEAD_INIT,
    "auditor_cpp",
    "High-performance C++ Forensic Auditor Engine",
    -1,
    AuditorMethods
};

PyMODINIT_FUNC PyInit_auditor_cpp(void) {
    return PyModule_Create(&auditormodule);
}