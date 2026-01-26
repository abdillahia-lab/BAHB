cmake_minimum_required(VERSION 3.10)
project(bahb_psdk_wrapper C)

set(CMAKE_C_STANDARD 99)
set(CMAKE_C_FLAGS "-pthread -std=gnu99 -Wall")
set(CMAKE_EXE_LINKER_FLAGS "-pthread")

# Cross-compilation for ARM64 (Manifold 3)
set(CMAKE_C_COMPILER aarch64-linux-gnu-gcc)
set(CMAKE_CXX_COMPILER aarch64-linux-gnu-g++)
add_definitions(-DPLATFORM_ARCH_aarch64=1)
add_definitions(-DSYSTEM_ARCH_LINUX)
add_definitions(-D_GNU_SOURCE)

# PSDK paths
set(PSDK_ROOT ${CMAKE_CURRENT_SOURCE_DIR}/../psdk/Payload-SDK-master)
set(PSDK_LIB_DIR ${PSDK_ROOT}/psdk_lib/lib/aarch64-linux-gnu-gcc)
set(PSDK_INC_DIR ${PSDK_ROOT}/psdk_lib/include)

# Include directories
include_directories(${PSDK_INC_DIR})
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/osal)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/hal)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/utils)
include_directories(${CMAKE_CURRENT_SOURCE_DIR}/src/monitor)

# Source files
file(GLOB_RECURSE OSAL_SRC src/osal/*.c)
file(GLOB_RECURSE HAL_SRC src/hal/*.c)
file(GLOB_RECURSE MONITOR_SRC src/monitor/*.c)
file(GLOB_RECURSE UTILS_SRC src/utils/*.c)

set(SOURCES
    src/main.c
    ${OSAL_SRC}
    ${HAL_SRC}
    ${MONITOR_SRC}
    ${UTILS_SRC}
)

# Link PSDK library
link_directories(${PSDK_LIB_DIR})

# Create executable
add_executable(${PROJECT_NAME} ${SOURCES})

# Link libraries
target_link_libraries(${PROJECT_NAME}
    ${PSDK_LIB_DIR}/libpayloadsdk.a
    m
    dl
    pthread
)

# Output to bin directory
set_target_properties(${PROJECT_NAME} PROPERTIES
    RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

# Post-build: Generate .dpk package
set(JSON_FILE ${CMAKE_CURRENT_SOURCE_DIR}/app.json)
set(DPK_SCRIPT ${PSDK_ROOT}/tools/build_dpk/build_dpk.sh)
set(DPK_OUTPUT ${CMAKE_BINARY_DIR}/dpk)

add_custom_command(TARGET ${PROJECT_NAME}
    POST_BUILD
    COMMAND ${CMAKE_COMMAND} -E make_directory ${DPK_OUTPUT}
    COMMAND bash ${DPK_SCRIPT} -i ${JSON_FILE} -o ${DPK_OUTPUT}
    COMMENT "Building .dpk package..."
)
