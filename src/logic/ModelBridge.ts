
/**
 * ZEROSIX REMOTE BRIDGE
 * Connects any device to the Gemma 4 E2B Server
 */
export const syncGemmaEcosystem = async () => {
  // REPLACE THIS with your actual LocalTunnel URL from your home machine
  const SERVER_URL = "https://your-actual-tunnel-id.loca.lt"; 

  try {
    const response = await fetch(`${SERVER_URL}/api/init-gemma`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: "gemma-4-e2b" })
    });

    if (!response.ok) throw new Error("Server not responding");
    const data = await response.json();

    // Sends the status message to your HUD
    window.dispatchEvent(new CustomEvent('app:log', { 
      detail: `[SYSTEM]: Gemma 4 E2B Cloud Linked. Sandbox: ${data.sandboxId}` 
    }));

    // This tells the 3D skeleton it's okay to move
    (window as any).remoteServer = SERVER_URL;
    (window as any).gemmaActive = true;

    return true;
  } catch (error) {
    console.error("Link Failure: Server is Offline.");
    return false;
  }
};
