/**
 * Custom Real User Monitoring Performance Agent
 * Demonstration for "Fundamentals of Web Performance"
 * by Todd Gardner <todd@toddhgardner.com>
 *
 * Not for production use.
 */
(() => {

  const payload = {
    url: window.location.href,
    dcl: 0,
    load: 0,
    fcp: 0,
    lcp: 0,
    cls: 0,
    fid: 0
  }

  // Navigation Performance Timings
  onDocumentReady(() => {
    setTimeout(() => { // "load" isn't done until the next cycle
      let navEntry = performance.getEntriesByType("navigation")[0];
      payload.dcl = navEntry.domContentLoadedEventStart;
      payload.load = navEntry.loadEventStart;
      console.log('Navigation Performance Timing', navEntry);
    }, 0);
  });

  // First Contentful Paint
  new PerformanceObserver((entryList) => {
    let entries = entryList.getEntries() || [];
    entries.forEach((entry) => {
      if (entry.name === "first-contentful-paint") {
        payload.fcp = entry.startTime;
        console.log(`FCP: ${payload.fcp}`);
      }
    });
  }).observe({ type: "paint", buffered: true });//buffered here gives you the events even if they've already happened

  // Largest Contentful Paint
  new PerformanceObserver((entryList) => {
    let entries = entryList.getEntries() || [];
    entries.forEach((entry) => {
      if (entry.startTime > payload.lcp) {
        payload.lcp = entry.startTime;
        console.log(`LCP: ${payload.lcp}`);
      }
    });
  }).observe({ type: "largest-contentful-paint", buffered: true });

  // Cumulative Layout Shift
  new PerformanceObserver((entryList) => {
    let entries = entryList.getEntries() || [];
    entries.forEach((entry) => {
      // this is to test if the shift was expected or triggered by a button click
      // like a menu opening or layout going to "full screen" that would cause the layout to shift
      // we don't want to capture things like this so this is a check for it
      if (!entry.hadRecentInput) {
        payload.cls += entry.value;
        console.log(`CLS: ${payload.cls}`);
      }
    });
  }).observe({ type: "layout-shift", buffered: true });

  // First Input Delay
  new PerformanceObserver((entryList) => {
    let entries = entryList.getEntries() || [];
    entries.forEach((entry) => {
      payload.fid = entry.processingStart - entry.startTime;
      console.log(`FID: ${payload.fid}`);
    });
  }).observe({ type: "first-input", buffered: true });

  // it's hard to tell when the page is actually done "fetching" all of the metric data that needs capturing so
  // this listens for the browser visibility to change, and when it does, it will send all of the data collected thus far to the server
  window.addEventListener("visibilitychange", () => {
    if (document.visibilityState === 'hidden') {
      let data = JSON.stringify(payload);
      navigator.sendBeacon("/api/perf", data);
      console.log("Sending performance:", data);
    }
  });

})();



// Utility functions to make example easier to understand.
function onDocumentReady(onReady) {
  if (document.readyState === "complete") { onReady(); }
  else {
    document.addEventListener('readystatechange', (event) => {
      if (document.readyState === "complete") { onReady(); }
    });
  }
}

