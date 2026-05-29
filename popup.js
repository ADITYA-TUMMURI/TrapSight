document.addEventListener('DOMContentLoaded', () => {
  const apiKeyInput = document.getElementById('apiKey');
  const saveBtn = document.getElementById('saveBtn');
  const statusBadge = document.getElementById('status');
  const statusText = statusBadge.querySelector('span');

  // Load existing API Key
  chrome.storage.local.get(['geminiApiKey'], (result) => {
    if (result.geminiApiKey) {
      apiKeyInput.value = result.geminiApiKey;
      setKeyStatus(true);
    } else {
      setKeyStatus(false);
    }
  });

  // Save API Key
  saveBtn.addEventListener('click', () => {
    const key = apiKeyInput.value.trim();
    chrome.storage.local.set({ geminiApiKey: key }, () => {
      if (key) {
        setKeyStatus(true);
        saveBtn.textContent = 'Saved Successfully!';
        saveBtn.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
        setTimeout(() => {
          saveBtn.textContent = 'Save API Key';
          saveBtn.style.background = '';
        }, 1500);
      } else {
        setKeyStatus(false);
      }
    });
  });

  function setKeyStatus(configured) {
    if (configured) {
      statusBadge.classList.add('active');
      statusText.textContent = 'Key Configured';
    } else {
      statusBadge.classList.remove('active');
      statusText.textContent = 'Key Not Configured';
    }
  }
});
