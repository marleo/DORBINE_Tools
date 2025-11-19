function compute() {
  // =============================
  // 🔹 INPUT PARAMETERS
  // =============================

  // Camera parameters
  const f_mm = Number(document.getElementById('f_mm').value) || 100; // focal length in mm
  const pixel_pitch_um = Number(document.getElementById('pixel_pitch').value) || 5.86; // pixel pitch in µm
  const blur_px_target = Number(document.getElementById('blur_px_target').value) || 2; // allowable blur in pixels

  // Real turbine parameters
  const r_real = Number(document.getElementById('r_real').value) || 50; // real blade radius [m]
  const v_tip_real_kmh = Number(document.getElementById('v_tip_real').value) || 150; // real tip speed [km/h]
  const R_real = Number(document.getElementById('R_real').value) || 75; // shooting distance [m]

  // Model turbine parameters
  const r_model = Number(document.getElementById('r_model').value) || 1; // model blade radius [m]

  // =============================
  // 🔹 PHYSICS CALCULATIONS
  // =============================

  // Convert input units
  const f_m = f_mm / 1000; // focal length in meters
  const v_real = v_tip_real_kmh / 3.6; // real tip speed [m/s]
  const omega = v_real / r_real; // angular velocity [rad/s] (same for real & model)
  const v_model = omega * r_model; // tip speed of model [m/s]
  const rpm_model = (omega * 60) / (2 * Math.PI); // model rotation speed [RPM]

  // Effective shooting distance for model (scaled with radius)
  const R_model = R_real * (r_model / r_real);

  // =============================
  // 🔹 IMAGE PLANE VELOCITIES
  // =============================

  // Project tip velocity onto image plane
  const vimg_real = (v_real * f_m) / R_real; // image-plane speed of real tip [m/s]
  const vimg_model = (v_model * f_m) / R_model; // image-plane speed of model tip [m/s]

  // Pixel pitch in meters
  const p_m = pixel_pitch_um * 1e-6;

  // Helper: compute blur in pixels for given exposure time
  function blur_px(vimg, t) {
    return (vimg * t) / p_m;
  }

  // Required shutter times (so blur ≤ target)
  const t_needed_real = (blur_px_target * p_m) / vimg_real;
  const t_needed_model = (blur_px_target * p_m) / vimg_model;

  // =============================
  // 🔹 BLUR TABLE FOR COMMON SHUTTERS
  // =============================

  const shutters = [
    1 / 30, 1 / 60, 1 / 125, 1 / 250,
    1 / 500, 1 / 1000, 1 / 2000,
    1 / 4000, 1 / 8000, 1 / 16000
  ];

  const isoMapping = {
    "1/30": "ISO 100",
    "1/60": "ISO 100",
    "1/125": "ISO 100",
    "1/250": "ISO 200",
    "1/500": "ISO 400",
    "1/1000": "ISO 800",
    "1/2000": "ISO 1600",
    "1/4000": "ISO 3200",
    "1/8000": "ISO 6400",
    "1/16000": "ISO 12800"
  };

  let tableRows = '';
  for (const s of shutters) {
    const frac = formatFraction(s);
    const b = blur_px(vimg_model, s);
    tableRows += `<tr>
            <td>${frac}</td>
            <td>${isoMapping[frac] || "-"}</td>
            <td>${b.toFixed(2)}</td>
        </tr>`;
  }

  document.getElementById('out').innerHTML = `
        <div class="card">
          <h3>Calculation Results</h3>
          <div class="results-grid">
            <div class="result-column">
              <h4>Real Turbine</h4>
              <div class="stat-row">
                <span class="stat-label">Shooting Distance</span>
                <span class="stat-value">${R_real.toFixed(3)} m</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Tip Speed</span>
                <span class="stat-value">${v_real.toFixed(3)} m/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Angular Speed</span>
                <span class="stat-value">${omega.toFixed(4)} rad/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Image Speed</span>
                <span class="stat-value">${(vimg_real * 1000).toFixed(2)} mm/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Required Shutter</span>
                <span class="stat-value highlight">${formatFraction(t_needed_real)} s</span>
              </div>
            </div>

            <div class="result-column">
              <h4>Model Turbine</h4>
              <div class="stat-row">
                <span class="stat-label">Shooting Distance</span>
                <span class="stat-value highlight">${R_model.toFixed(2)} m</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Tip Speed</span>
                <span class="stat-value">${v_model.toFixed(3)} m/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Angular Speed</span>
                <span class="stat-value">${omega.toFixed(4)} rad/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Set RPM To</span>
                <span class="stat-value highlight">${rpm_model.toFixed(2)} RPM</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Image Speed</span>
                <span class="stat-value">${(vimg_model * 1000).toFixed(2)} mm/s</span>
              </div>
              <div class="stat-row">
                <span class="stat-label">Required Shutter</span>
                <span class="stat-value highlight">${formatFraction(t_needed_model)} s</span>
              </div>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead><tr><th>Shutter Speed</th><th>ISO Equivalent</th><th>Blur at Tip (px)</th></tr></thead>
              <tbody>
              ${tableRows}
              </tbody>
            </table>
          </div>
        </div>
      `;
}

function formatFraction(s) {
  if (s >= 1) return `${s.toFixed(3)} s`;
  if (s < 1 / 30000) return s.toExponential(2);
  const inv = Math.round(1 / s);
  return `1/${inv}`;
}

// Run on button click and at load
document.getElementById('run').onclick = compute;
compute();
