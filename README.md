# Project Vajra — Sovereign Post-Quantum Cryptographic Gateway

**Prapti Labs** · Security is Culture · p.karteek@gmail.com  
**iDEX Open Challenge 2026** · SPARK Grant Applicant · TRL 2 → 7

---

## What is Project Vajra?

Project Vajra is a transparent software sidecar that wraps any legacy device in quantum-safe encryption — without replacing hardware, without changing application code, and without modifying firmware.

```
[Legacy Device] ── plain TCP ──▶ [Vajra-A] ══ encrypted tunnel ══▶ [Vajra-B] ── plain TCP ──▶ [Backend]
                                       ML-KEM-768 + X25519 + HKDF-SHA384 + AES-256-GCM
```

A `docker-compose up` starts the full demo in three containers. The legacy application has zero awareness of the encryption layer.

---

## The Problem

Nation-state adversaries are executing **Harvest Now, Decrypt Later (HNDL)** attacks — recording encrypted traffic today to decrypt it once cryptographically relevant quantum computers (CRQCs) arrive, projected between 2030 and 2035.

India's exposure:

| Asset class | Units at risk | Replacement cost |
|---|---|---|
| Tactical HF radios | 8,000+ | — |
| VSAT / satellite terminals | 1,500+ | — |
| Banking switches (UPI, RTGS, CBS) | 800+ | — |
| **Total hardware replacement** | — | **Rs. 21,300+ Crore** |

Hardware replacement at that cost and timeline is not feasible. Vajra delivers the same quantum-safe guarantee in software at **10% of the cost**, deployable in under 15 minutes per endpoint.

---

## Cryptographic Design

### Hybrid KEM Formula

```
master_secret = HKDF-SHA384(ss_classical ‖ ss_pq, info="vajra-v1-master-secret")

ss_classical  = X25519-ECDH(ephemeral_key_A, ephemeral_key_B)
ss_pq         = ML-KEM-768.Decapsulate(sk, ciphertext)
```

**Security guarantee:** An adversary must break **both** X25519 and ML-KEM-768 simultaneously. Breaking one algorithm yields zero information about the master secret.

### Full Cryptographic Stack

| Component | Algorithm | Standard | Crate |
|---|---|---|---|
| PQC Key Exchange | ML-KEM-768 | NIST FIPS 203 (Aug 2024 final) | `oqs = "0.10"` |
| PQC Signatures | ML-DSA-65 | NIST FIPS 204 (Aug 2024 final) | `oqs = "0.10"` |
| Classical Key Exchange | X25519 ECDH | RFC 7748 | `x25519-dalek = "2"` |
| Key Derivation | HKDF-SHA384 | RFC 5869 | `hkdf + sha2` |
| Session Encryption | AES-256-GCM | NIST SP 800-38D | `aes-gcm = "0.10"` |
| Key Zeroization | — | Compile-time guarantee | `zeroize = "1"` |

### NIST FIPS 203 Key Sizes

| Parameter | Size |
|---|---|
| ML-KEM-768 public key | 1,184 bytes |
| ML-KEM-768 secret key | 2,400 bytes |
| ML-KEM-768 ciphertext | 1,088 bytes |
| Shared secret | 32 bytes |
| AES-256-GCM nonce | 12 bytes |
| AES-256-GCM auth tag | 16 bytes |

---

## Architecture — Four Isolated Layers

```
┌─────────────────────────────────────────────────────────┐  ← Legacy TCP in/out
│  LAYER 01 — DATA PLANE                                  │
│  Rust + Tokio + Hyper                                   │
│  TCP interception · Hybrid KEM · AES-256-GCM            │
└────────────────────┬────────────────────────────────────┘
                     │ policy · reload
┌─────────────────────────────────────────────────────────┐  ← gRPC management API
│  LAYER 02 — CONTROL PLANE                               │
│  Crypto-Agility Engine                                  │
│  gRPC + etcd · Algorithm hot-swap · ML-DSA-65 PKI       │
└────────────────────┬────────────────────────────────────┘
                     │ PKCS#11 · key ops
┌─────────────────────────────────────────────────────────┐  ← HSM / TPM (PKCS#11)
│  LAYER 03 — KEY MANAGEMENT                              │
│  Sovereign KMS                                          │
│  PKCS#11 HSM/TPM · Air-gap USB · Indian key jurisdiction│
└────────────────────┬────────────────────────────────────┘
                     │ OTel · metrics
┌─────────────────────────────────────────────────────────┐  ← SIEM / syslog / CEF
│  LAYER 04 — OBSERVABILITY                               │
│  OpenTelemetry · Hash-chained audit log · SIEM export   │
└─────────────────────────────────────────────────────────┘
```

---

## Workspace Structure

```
vajra/
├── Cargo.toml              # Workspace root — shared dependencies
├── vajra-core/             # Pure crypto library — NO I/O, NO async
│   └── src/
│       ├── error.rs        # VajraError enum + Result<T>
│       ├── kem.rs          # HybridKeypair + encapsulate() — ML-KEM-768 + X25519
│       ├── cipher.rs       # SessionCipher — AES-256-GCM
│       └── handshake.rs    # Initiator/Responder handshake (async)
├── vajra-proxy/            # Deployable binary — async TCP proxy
│   └── src/
│       ├── main.rs         # CLI entry point (clap) + tracing init
│       ├── config.rs       # Config struct + Role enum — loaded from YAML
│       ├── proxy.rs        # run() — Semaphore-bounded accept loop
│       └── tunnel.rs       # VajraTunnel — connect/accept/send/recv
├── vajra-bench/            # criterion benchmarks — dev only
│   └── benches/
│       └── kem_bench.rs
├── config/
│   ├── vajra-a.yaml        # Initiator config
│   └── vajra-b.yaml        # Responder config
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
└── tests/
    └── integration_test.rs
```

**Future crates (post-grant):**

| Crate | Milestone | Purpose |
|---|---|---|
| `vajra-kms/` | M3 | Sovereign KMS — key gen, rotation, PKCS#11 HSM |
| `vajra-api/` | M3 | gRPC management API + REST gateway |
| `vajra-web/` | M6 | React + TypeScript admin dashboard |

---

## Prerequisites

```bash
# Ubuntu / Debian
sudo apt-get install -y cmake gcc g++ pkg-config libssl-dev libclang-dev build-essential

# Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env

# Docker (for demo)
sudo apt-get install docker.io docker-compose
```

> **First build takes 5–15 minutes** — liboqs compiles from C source. Subsequent builds use the cache and are fast.

---

## Quick Start

### 1. Verify oqs builds on your machine (do this first)

```bash
cd /tmp && cargo new oqs-test && cd oqs-test
# Add to Cargo.toml: oqs = { version = "0.10", features = ["kem"] }
# Replace src/main.rs:
cat > src/main.rs << 'EOF'
fn main() {
    oqs::init();
    let kem = oqs::kem::Kem::new(oqs::kem::Algorithm::MlKem768).unwrap();
    let (pk, sk) = kem.keypair().unwrap();
    let (ct, ss1) = kem.encapsulate(&pk).unwrap();
    let ss2 = kem.decapsulate(&sk, &ct).unwrap();
    assert_eq!(ss1.as_ref(), ss2.as_ref());
    println!("ML-KEM-768 OK: {} bytes", ss1.len());
}
EOF
cargo run
# Expected: ML-KEM-768 OK: 32 bytes
```

### 2. Build the workspace

```bash
git clone https://github.com/YOUR_USERNAME/vajra.git
cd vajra
cargo build
```

### 3. Run tests

```bash
# All tests
cargo test

# With verbose output (shows NIST key sizes — use for HPSC demo)
cargo test -- --nocapture

# Specific test suites
cargo test -p vajra-core kem        # KEM unit tests
cargo test -p vajra-core cipher     # AES-GCM tests
cargo test nist_fips_203 -- --nocapture  # NIST KAT validation
```

### 4. Run locally (3 terminals)

**Terminal 1 — Backend (legacy service, unchanged):**
```bash
nc -lk 7777
```

**Terminal 2 — Vajra-B (Responder):**
```bash
cargo run -p vajra-proxy -- --config config/vajra-b.yaml
```

**Terminal 3 — Vajra-A (Initiator):**
```bash
cargo run -p vajra-proxy -- --config config/vajra-a.yaml
```

**Terminal 4 — Send a message:**
```bash
echo "CLASSIFIED: quantum-safe test" | nc 127.0.0.1 8080
# Appears in Terminal 1 — backend receives plaintext unchanged
# Wireshark on port 9090 shows binary ciphertext between Vajra-A and Vajra-B
```

### 5. Run with Docker (one command)

```bash
cd docker
docker-compose up --build
echo "CLASSIFIED: Docker demo" | nc localhost 8080
docker-compose logs vajra-a | grep handshake
```

---

## Configuration

```yaml
# config/vajra-a.yaml — Initiator
role: initiator
listen_addr: "127.0.0.1:8080"
forward_addr: "127.0.0.1:9090"
log_level: "debug"
max_connections: 32        # DDoS protection — prevents memory exhaustion
idle_timeout_secs: 120     # HF radio resilience — releases stalled connections

# config/vajra-b.yaml — Responder
role: responder
listen_addr: "127.0.0.1:9090"
forward_addr: "127.0.0.1:7777"
log_level: "debug"
max_connections: 32
idle_timeout_secs: 120
```

**Profile defaults:**

| Profile | max_connections | idle_timeout_secs |
|---|---|---|
| Tactical Edge (64MB RAM) | 32 | 120s |
| Enterprise Core | 256 | 300s |
| Sovereign Cloud | 128 | 600s |

---

## Benchmarks

```bash
cargo bench -p vajra-bench
# HTML report: target/criterion/report/index.html
```

**Expected results (x86_64 laptop):**

| Benchmark | Expected |
|---|---|
| `hybrid_keypair_generation` | 50–200 µs |
| `hybrid_encapsulate` | 100–300 µs |
| `hybrid_decapsulate` | 80–250 µs |
| `hybrid_full_handshake` | **300–700 µs** ← key number for HPSC |
| `aes_gcm/encrypt/1024` | 1–5 µs |

> ARM benchmark (Bharat-Pi Gen 2, Cortex-A55): measured at M4. Expected 600µs–1.5ms — still within the sub-2ms target.

---

## Dependency Licences

All dependencies are permissive — zero GPL, zero copyleft, zero royalties.

| Crate | Licence | Purpose |
|---|---|---|
| `oqs` (liboqs-rust) | Apache-2.0 / MIT | ML-KEM-768 + ML-DSA-65 |
| `x25519-dalek` | BSD-3-Clause | Classical X25519 ECDH |
| `aes-gcm` | MIT / Apache-2.0 | AES-256-GCM session cipher |
| `hkdf` + `sha2` | MIT / Apache-2.0 | HKDF-SHA384 key derivation |
| `zeroize` | MIT / Apache-2.0 | Compile-time key zeroization |
| `tokio` | MIT | Async runtime |
| `socket2` | MIT / Apache-2.0 | SO_KEEPALIVE for HF resilience |

`liboqs` is developed by the [Open Quantum Safe](https://openquantumsafe.org/) project (University of Waterloo / Linux Foundation Post-Quantum Cryptography Alliance). Licensed MIT. No known patent claims on ML-KEM-768.

---

## Deployment Profiles

### Profile 01 — Tactical Edge (Defence)

Target: HF radios, VSAT terminals, SDRs, drone data links  
Hardware: Bharat-Pi Gen 2 (ARM Cortex-A55, 4GB RAM) — primary

```bash
# ARM cross-compilation (glibc — use this first at M4)
sudo apt-get install gcc-aarch64-linux-gnu
rustup target add aarch64-unknown-linux-gnu
export CC=aarch64-linux-gnu-gcc
export CARGO_TARGET_AARCH64_UNKNOWN_LINUX_GNU_LINKER=aarch64-linux-gnu-gcc
cargo build --release --target aarch64-unknown-linux-gnu

# Verify truly static (musl production binary)
rustup target add aarch64-unknown-linux-musl
cargo build --release --target aarch64-unknown-linux-musl
file target/aarch64-unknown-linux-musl/release/vajra-proxy
# Must say: statically linked
```

### Profile 02 — Enterprise Core (Banking / BFSI)

Target: SWIFT gateways, RTGS nodes, UPI switches, CBS  
Deployment: Stateless OCI containers, 2,000+ TPS

### Profile 03 — Sovereign Cloud (Government / NIC)

Target: Ministry networks, G2G gateways, NIC data centres  
Key jurisdiction: India only — no foreign key material in the cryptographic path

---

## Roadmap

| Milestone | Deliverable | TRL | Month |
|---|---|---|---|
| M1 | Architecture spec + hybrid KEM design + threat model | 2→3 | 1 |
| M2 | Working Rust hybrid KEM + NIST KAT validation | 3 | 1–3 |
| M3 | TCP proxy + Sovereign KMS v1 + Docker demo | 3→4 | 3–7 |
| M4 | Bharat-Pi ARM prototype + air-gap USB provisioner | 4 | 5–7 |
| M5 | BEL / ECIL field trial on real defence hardware | 5–6 | 8–12 |
| M6 | gRPC management API + mTLS + SIEM + Web UI | 6 | 9–14 |
| M7 | STQC certification submission + EAL 4+ package | 7 | 13–18 |

**Funding:** iDEX SPARK Grant Rs. 1.50 Crore + Matching Contribution Rs. 1.50 Crore = Rs. 3.00 Crore Product Development Budget

---

## Common Issues

| Error | Cause | Fix |
|---|---|---|
| `cmake not found` | cmake not installed | `sudo apt-get install cmake` |
| `libssl not found` | missing dev package | `sudo apt-get install libssl-dev` |
| First build very slow | liboqs compiling from C | Normal — 5–15 min, then cached |
| Port already in use | Previous instance running | `sudo lsof -i :8080` → kill PID |
| Handshake hangs | Only one Vajra running | Start Vajra-B **before** Vajra-A |
| ARM linker error `cannot find -lgcc_s` | Wrong linker for musl | Use musl.cc toolchain, not apt gcc |

---

## Security Notes

- `oqs::init()` is called once in `main()` before any tasks are spawned — if liboqs fails to initialise it panics in `main()` with a clear message, not silently inside a spawned task
- Secret key material is in structs deriving `ZeroizeOnDrop` — compile-time guaranteed wipe on session end
- IKM (HKDF input) is explicitly `.zeroize()`d after key derivation
- No secret material is ever logged — tracing calls on key operations use `debug!` or `trace!` only
- Connection limiting via `tokio::sync::Semaphore` prevents memory exhaustion on 64MB RAM tactical devices
- Idle timeout via `tokio::time::timeout` releases stalled connections on HF radio lossy links

---

## Programme

- **iDEX Open Challenge 2026** — Defence Innovation Organisation, Ministry of Defence
- **National Quantum Mission (NQM)** — DST India, 2031 objectives
- **Aatmanirbhar Bharat** — 100% indigenous codebase, no foreign IP, no export control restrictions
- **Standards alignment** — NIST FIPS 203 (ML-KEM-768) + NIST FIPS 204 (ML-DSA-65), August 2024 final
- **Certification target** — STQC / Common Criteria EAL 4+ (Month 13–18)

---

## Contact

**Prapti Labs**  
Pulugulla Karteek · p.karteek@gmail.com  
Hyderabad, Telangana, India  
[linkedin.com/in/karteek-p-85217a22](https://linkedin.com/in/karteek-p-85217a22)  
[praptilabs.in](https://praptilabs.in)

---

*"Security is Culture."*
