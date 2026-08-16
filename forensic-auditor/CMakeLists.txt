cmake_minimum_required(VERSION 3.10)
project(auditor_cpp)

find_package(Python 3 REQUIRED COMPONENTS Interpreter Development)

add_library(auditor_cpp MODULE
    bridge.cpp
    auditor-engine.cpp
)

target_include_directories(auditor_cpp PRIVATE ${Python_INCLUDE_DIRS})
target_link_libraries(auditor_cpp PRIVATE ${Python_LIBRARIES})

set_target_properties(auditor_cpp PROPERTIES PREFIX "")