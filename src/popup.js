document.addEventListener('DOMContentLoaded', async () => {
  const status = document.getElementById('status');
  const selectionModeSection = document.getElementById('selectionModeSection');
  const typstSelectionNotice = document.getElementById('typstSelectionNotice');
  const delimiterSection = document.getElementById('delimiterSection');
  const inlineDelimiterType = document.getElementById('inlineDelimiterType');
  const displayDelimiterType = document.getElementById('displayDelimiterType');
  const inlineCustomGroup = document.getElementById('inlineCustomGroup');
  const displayCustomGroup = document.getElementById('displayCustomGroup');
  const openShortcuts = document.getElementById('openShortcuts');
  const shortcutHint = document.getElementById('shortcutHint');

  const elements = {
    outputFormat: [...document.querySelectorAll('input[name="outputFormat"]')],
    selectionCopyMode: [...document.querySelectorAll('input[name="selectionCopyMode"]')],
    enableFloatingButton: document.getElementById('enableFloatingButton'),
    hijackNormalCopy: document.getElementById('hijackNormalCopy'),
    enableCustomCopyShortcut: document.getElementById('enableCustomCopyShortcut'),
    inlineDelimiterType,
    inlineCustomStart: document.getElementById('inlineCustomStart'),
    inlineCustomEnd: document.getElementById('inlineCustomEnd'),
    displayDelimiterType,
    displayCustomStart: document.getElementById('displayCustomStart'),
    displayCustomEnd: document.getElementById('displayCustomEnd')
  };

  let statusTimer = null;

  function setRadioValue(name, value) {
    const radio = elements[name].find((input) => input.value === value);
    if (radio) {
      radio.checked = true;
    }
  }

  function getRadioValue(name) {
    const selected = elements[name].find((input) => input.checked);
    return selected ? selected.value : CopyLatexSettings.defaults[name];
  }

  function toggleCustomGroups() {
    inlineCustomGroup.hidden = inlineDelimiterType.value !== 'custom';
    displayCustomGroup.hidden = displayDelimiterType.value !== 'custom';
  }

  function toggleLatexOnlySections() {
    const isTypst = getRadioValue('outputFormat') === 'typst';
    selectionModeSection.hidden = isTypst;
    typstSelectionNotice.hidden = !isTypst;
    delimiterSection.hidden = isTypst;
  }

  function showStatus(message) {
    status.textContent = message;
    if (statusTimer) {
      window.clearTimeout(statusTimer);
    }
    statusTimer = window.setTimeout(() => {
      status.textContent = '';
    }, 1500);
  }

  async function saveSettings() {
    const payload = {
      outputFormat: getRadioValue('outputFormat'),
      selectionCopyMode: getRadioValue('selectionCopyMode'),
      enableFloatingButton: elements.enableFloatingButton.checked,
      hijackNormalCopy: elements.hijackNormalCopy.checked,
      enableCustomCopyShortcut: elements.enableCustomCopyShortcut.checked,
      inlineDelimiterType: elements.inlineDelimiterType.value,
      inlineCustomStart: elements.inlineCustomStart.value,
      inlineCustomEnd: elements.inlineCustomEnd.value,
      displayDelimiterType: elements.displayDelimiterType.value,
      displayCustomStart: elements.displayCustomStart.value,
      displayCustomEnd: elements.displayCustomEnd.value
    };

    await chrome.storage.local.set(payload);
    showStatus('Saved');
  }

  async function loadShortcutState() {
    if (!chrome.commands?.getAll) {
      shortcutHint.textContent = 'Shortcut settings unavailable here';
      return;
    }

    const commands = await chrome.commands.getAll();
    const command = commands.find((item) => item.name === 'copy-selection-with-addon');
    shortcutHint.textContent = command?.shortcut
      ? `Current shortcut: ${command.shortcut}`
      : 'No shortcut assigned yet';
  }

  const stored = await chrome.storage.local.get(CopyLatexSettings.storageKeys);
  const settings = CopyLatexSettings.merge(stored);

  setRadioValue('outputFormat', settings.outputFormat);
  setRadioValue('selectionCopyMode', settings.selectionCopyMode);
  elements.enableFloatingButton.checked = settings.enableFloatingButton;
  elements.hijackNormalCopy.checked = settings.hijackNormalCopy;
  elements.enableCustomCopyShortcut.checked = settings.enableCustomCopyShortcut;
  elements.inlineDelimiterType.value = settings.inlineDelimiterType;
  elements.inlineCustomStart.value = settings.inlineCustomStart;
  elements.inlineCustomEnd.value = settings.inlineCustomEnd;
  elements.displayDelimiterType.value = settings.displayDelimiterType;
  elements.displayCustomStart.value = settings.displayCustomStart;
  elements.displayCustomEnd.value = settings.displayCustomEnd;

  toggleCustomGroups();
  toggleLatexOnlySections();
  await loadShortcutState();

  const autoSaveInputs = [
    ...elements.outputFormat,
    ...elements.selectionCopyMode,
    elements.enableFloatingButton,
    elements.hijackNormalCopy,
    elements.enableCustomCopyShortcut,
    elements.inlineDelimiterType,
    elements.inlineCustomStart,
    elements.inlineCustomEnd,
    elements.displayDelimiterType,
    elements.displayCustomStart,
    elements.displayCustomEnd
  ];

  autoSaveInputs.forEach((input) => {
    input.addEventListener('change', async () => {
      toggleCustomGroups();
      toggleLatexOnlySections();
      await saveSettings();
    });
  });

  openShortcuts.addEventListener('click', async () => {
    await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' });
  });
});
