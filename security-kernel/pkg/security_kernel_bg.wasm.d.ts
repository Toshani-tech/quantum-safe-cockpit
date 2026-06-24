/* tslint:disable */
/* eslint-disable */
export const memory: WebAssembly.Memory;
export const fp_add: (a: number, b: number) => number;
export const fp_div: (a: number, b: number) => number;
export const fp_exp: (a: number) => number;
export const fp_from_int: (a: number) => number;
export const fp_mul: (a: number, b: number) => number;
export const fp_sub: (a: number, b: number) => number;
export const get_telemetry_buffer_ptr: () => number;
export const rk4_step: (a: number, b: number, c: number, d: number) => [number, number];
export const set_initial_state: (a: number, b: number) => void;
export const step_physics_fp: (a: number) => number;
export const init_panic_hook: () => void;
export const __wbindgen_externrefs: WebAssembly.Table;
export const __wbindgen_free: (a: number, b: number, c: number) => void;
export const __wbindgen_start: () => void;
