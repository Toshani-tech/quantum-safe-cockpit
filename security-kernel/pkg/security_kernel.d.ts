/* tslint:disable */
/* eslint-disable */

export function get_telemetry_buffer_ptr(): number;

export function init_panic_hook(): void;

export function rk4_step(current_alt: number, v_ias: number, pitch_deg: number, dt: number): Float64Array;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly fp_add: (a: number, b: number) => number;
    readonly fp_div: (a: number, b: number) => number;
    readonly fp_exp: (a: number) => number;
    readonly fp_from_int: (a: number) => number;
    readonly fp_mul: (a: number, b: number) => number;
    readonly fp_sub: (a: number, b: number) => number;
    readonly get_telemetry_buffer_ptr: () => number;
    readonly rk4_step: (a: number, b: number, c: number, d: number) => [number, number];
    readonly set_initial_state: (a: number, b: number) => void;
    readonly step_physics_fp: (a: number) => number;
    readonly init_panic_hook: () => void;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
