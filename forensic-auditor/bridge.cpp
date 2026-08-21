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
        if (!item || !PyDict_Check(item)) continue;

        FlightRecord r;

        // Safe extraction for 't' (handles int or float gracefully)
        PyObject* val_t = PyDict_GetItemString(item, "t");
        if (val_t) {
            PyObject* py_num = PyNumber_Long(val_t);
            if (py_num) {
                r.t = (int)PyLong_AsLong(py_num);
                Py_DECREF(py_num);
            } else {
                PyErr_Clear();
                r.t = 0;
            }
        } else {
            r.t = 0;
        }

        // Safe extraction for 'alt'
        PyObject* val_alt = PyDict_GetItemString(item, "alt");
        if (val_alt) {
            PyObject* py_num = PyNumber_Long(val_alt);
            if (py_num) {
                r.alt = (int)PyLong_AsLong(py_num);
                Py_DECREF(py_num);
            } else {
                PyErr_Clear();
                r.alt = 0;
            }
        } else {
            r.alt = 0;
        }

        // Safe extraction for spd
        PyObject* val_spd = PyDict_GetItemString(item, "spd");
        if (val_spd) {
            PyObject* py_num = PyNumber_Long(val_spd);
            if (py_num) {
                r.spd = (int)PyLong_AsLong(py_num);
                Py_DECREF(py_num);
            } else {
                PyErr_Clear();
                r.spd = 0;
            }
        } else {
            r.spd = 0;
        }

        // Safe extraction for lat
        PyObject* val_lat = PyDict_GetItemString(item, "lat");
        if (val_lat) {
            PyObject* py_flt = PyNumber_Float(val_lat);
            if (py_flt) {
                r.lat = PyFloat_AsDouble(py_flt);
                Py_DECREF(py_flt);
            } else {
                PyErr_Clear();
                r.lat = 0.0;
            }
        } else {
            r.lat = 0.0;
        }

        // Safe extraction for phase
        PyObject* val_phase = PyDict_GetItemString(item, "phase");
        if (val_phase && PyUnicode_Check(val_phase)) {
            const char* utf8_str = PyUnicode_AsUTF8(val_phase);
            r.phase = utf8_str ? utf8_str : "N/A";
        } else {
            r.phase = "N/A";
        }

        records.push_back(r);
    }

    AuditorEngine engine;
    AuditResult res = engine.analyzeLogs(records);

    PyObject* dict = PyDict_New();
    if (!dict) return NULL;
    
    PyDict_SetItemString(dict, "total_records", PyLong_FromLong(res.total_records));
    PyDict_SetItemString(dict, "peak_latency", PyFloat_FromDouble(res.peak_latency));
    PyDict_SetItemString(dict, "max_altitude", PyLong_FromLong(res.max_altitude));
    PyDict_SetItemString(dict, "max_airspeed", PyLong_FromLong(res.max_airspeed));
    PyDict_SetItemString(dict, "verdict", PyUnicode_FromString(res.verdict.c_str()));

    return dict;
}

static PyMethodDef AuditorMethods[] = {
    {"analyze_logs", py_analyze_logs, METH_VARARGS, "Analyze flight logs using C++ engine."},
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