// Основной контентный скрипт
// Инициализирует работу панели
console.log("[GlassPanel] Content script загружен")

// Глобальные переменные и объекты
const glassPanel = {
  panel: null,
  settings: null,
  timers: null, // Добавляем объект для работы с таймерами
}

// Настройки таймера (глобально для синхронизации)
let timerSettings = {
  timerType: "static", // static или custom
  staticTimerRemainingSeconds: 180, // 3 минуты
  customTimerRemainingSeconds: 0,
  customTimerDirection: "down", // 'down' или 'up'
  customTimerYellowWarningSeconds: 30,
  customTimerRedWarningSeconds: 10,
  isTimerRunning: false,
  pausedAt: null,
  // Добавляем информацию о том, какая вкладка управляет таймером
  controlTabId: null, // ID вкладки, управляющей таймером
  lastUpdateTime: 0, // Время последнего обновления
  timerStartTimestamp: 0, // Время запуска таймера для расчета прошедшего времени
}

// Флаг, показывающий, был ли инициализирован content script
let isContentScriptInitialized = false

// Функция инициализации content script
function initContentScript() {
  if (isContentScriptInitialized) {
    console.log(
      "[GlassPanel] Content script уже инициализирован, пропускаем повторную инициализацию"
    )
    return
  }

  console.log("[GlassPanel] Инициализация content script")

  // Устанавливаем флаг инициализации
  isContentScriptInitialized = true

  // Запрашиваем текущее состояние панели
  checkPanelState()

  // Устанавливаем обработчик сообщений от background.js
  setupMessageListener()

  console.log("[GlassPanel] Content script успешно инициализирован")
}

// Установка обработчика сообщений от background.js
function setupMessageListener() {
  console.log("[GlassPanel] Устанавливаем обработчик сообщений")

  // Обработка сообщений от background.js
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("[GlassPanel] Получено сообщение:", message)

    try {
      if (message.action === "togglePanel") {
        console.log(
          `[GlassPanel] Обрабатываем togglePanel, show=${message.show}`
        )

        // Убеждаемся, что статус правильно установлен
        const shouldShow = !!message.show // Приводим к boolean
        console.log(`[GlassPanel] Преобразованный статус show=${shouldShow}`)

        // Вызываем togglePanel с явным указанием show параметра
        handleTogglePanel(shouldShow)

        // Подтверждаем получение с результатом действия
        console.log(
          "[GlassPanel] Отправляем подтверждение обработки togglePanel"
        )
        sendResponse({
          success: true,
          panelVisible: shouldShow,
          timestamp: Date.now(),
        })
      } else if (message.action === "updateTimerSettings") {
        // Получены обновленные настройки таймера от background.js
        if (message.settings) {
          // Обновляем настройки таймера
          handleTimerSettingsUpdate(message.settings)

          // Подтверждаем получение
          sendResponse({
            success: true,
            timestamp: Date.now(),
          })
        }
      }
    } catch (error) {
      console.error("[GlassPanel] Ошибка при обработке сообщения:", error)
      sendResponse({ success: false, error: error.message })
    }

    return true // Явно указываем, что планируем вызывать sendResponse асинхронно
  })
}

// Реализация panel.js
// ===================================
// Функции для работы с панелью
console.log("[GlassPanel] Инициализация модуля panel")

/**
 * Создает панель и вставляет её в начало тела документа
 */
function createPanel() {
  console.log("[GlassPanel] Вызвана функция createPanel")

  try {
    // Проверяем, если панель уже существует
    if (document.getElementById("glass-panel")) {
      console.log("[GlassPanel] Панель уже существует, возвращаем существующую")
      return document.getElementById("glass-panel")
    }

    // Проверяем доступность document.body
    if (!document.body) {
      console.error(
        "[GlassPanel] document.body недоступен, невозможно создать панель"
      )
      return null
    }

    console.log("[GlassPanel] Создаем новую панель")
    // Создаем саму панель
    const panel = document.createElement("div")
    panel.id = "glass-panel"

    // Добавляем контент в панель с одним таймером
    panel.innerHTML = `
      <div id="glass-panel-content">
        <div id="timer-container" class="timer-container">
          <div class="timer-display">03:00</div>
          <div class="timer-controls">
            <button class="timer-btn start-btn" title="Запустить">▶</button>
            <button class="timer-btn pause-btn" title="Пауза">⏸️</button>
            <button class="timer-btn reset-btn" title="Сбросить">↺</button>
          </div>
        </div>
      </div>
    `

    // Создаем кнопки для управления панелью
    const buttonContainer = document.createElement("div")
    buttonContainer.id = "glass-panel-buttons"

    const settingsButton = document.createElement("button")
    settingsButton.id = "glass-panel-settings"
    settingsButton.textContent = "⚙️"
    settingsButton.title = "Настройки"

    const closeButton = document.createElement("button")
    closeButton.id = "glass-panel-close"
    closeButton.textContent = "✕"
    closeButton.title = "Закрыть"

    buttonContainer.appendChild(settingsButton)
    buttonContainer.appendChild(closeButton)
    panel.appendChild(buttonContainer)

    // Добавляем панель в начало body
    console.log("[GlassPanel] document.body доступен, вставляем панель")
    document.body.insertBefore(panel, document.body.firstChild)

    // Устанавливаем отступ для body чтобы контент не перекрывался
    document.body.style.marginTop = "50px"

    // Обновляем обработчики событий для кнопок
    updateEventListeners()

    // Инициализируем таймер
    initTimer()

    console.log("[GlassPanel] Панель успешно создана")
    return panel
  } catch (error) {
    console.error("[GlassPanel] Ошибка при создании панели:", error)
    return null
  }
}

/**
 * Показывает или скрывает панель
 * @param {boolean} show - флаг, показывать ли панель
 */
function togglePanel(show) {
  console.log(
    `[GlassPanel] Вызвана функция togglePanel с параметром show=${show}`
  )

  try {
    let panel = document.getElementById("glass-panel")
    const modal = document.getElementById("glass-settings-modal")

    console.log("[GlassPanel] Текущая панель:", panel)
    console.log("[GlassPanel] Текущее модальное окно:", modal)

    if (show) {
      // Если нужно показать панель
      if (!panel) {
        console.log(
          "[GlassPanel] Панель не существует и show=true, создаем панель"
        )
        panel = createPanel()
        if (!panel) {
          console.error("[GlassPanel] Не удалось создать панель")
          return
        }
      } else {
        // Если панель уже существует, просто делаем ее видимой
        console.log("[GlassPanel] Панель существует, делаем видимой")
        panel.style.display = "flex"
      }

      // Явно устанавливаем стили отображения
      panel.style.position = "fixed"
      panel.style.top = "0"
      panel.style.left = "0"
      panel.style.right = "0"
      panel.style.zIndex = "2147483647"

      // Устанавливаем отступ для body
      if (document.body) {
        const panelHeight = panel.offsetHeight || 50
        console.log(`[GlassPanel] Устанавливаем marginTop=${panelHeight}px`)
        document.body.style.marginTop = panelHeight + "px"
        document.body.style.transition = "margin-top 0.3s ease"
      }

      // Обновляем обработчики событий
      setTimeout(updateEventListeners, 100)
    } else {
      // Если нужно скрыть панель
      if (panel) {
        console.log(
          "[GlassPanel] Панель существует и show=false, удаляем панель из DOM"
        )

        // Сначала восстанавливаем marginTop для body
        if (document.body) {
          console.log("[GlassPanel] Возвращаем marginTop=0")
          document.body.style.marginTop = "0"
        }

        // Затем удаляем панель из DOM
        panel.parentNode.removeChild(panel)
        console.log("[GlassPanel] Панель удалена из DOM")
      } else {
        console.log(
          "[GlassPanel] Панель не существует и show=false, ничего не делаем"
        )
      }

      // Также закрываем модальное окно настроек если оно открыто
      if (modal) {
        console.log("[GlassPanel] Закрываем модальное окно настроек")
        modal.parentNode.removeChild(modal)
        console.log("[GlassPanel] Модальное окно удалено из DOM")
      }
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при togglePanel:", error)
  }
}

// Регистрируем панель
glassPanel.panel = {
  create: createPanel,
  toggle: togglePanel,
}

console.log("[GlassPanel] Модуль panel инициализирован", glassPanel.panel)

// Реализация settings.js
// ===================================
// Функции для работы с окном настроек
console.log("[GlassPanel] Инициализация модуля settings")

/**
 * Создает модальное окно настроек
 */
function createSettingsModal() {
  console.log("[GlassPanel] Вызвана функция createSettingsModal")

  try {
    // Проверяем, не создано ли уже модальное окно
    if (document.getElementById("glass-settings-modal")) {
      console.log(
        "[GlassPanel] Модальное окно уже существует, возвращаем существующее"
      )
      return document.getElementById("glass-settings-modal")
    }

    // Проверяем доступность document.body
    if (!document.body) {
      console.error(
        "[GlassPanel] document.body недоступен, невозможно создать модальное окно"
      )
      return null
    }

    console.log("[GlassPanel] Создаем новое модальное окно")
    // Создаем модальное окно настроек
    const settingsModal = document.createElement("div")
    settingsModal.id = "glass-settings-modal"
    settingsModal.style.display = "none"

    const settingsContent = document.createElement("div")
    settingsContent.id = "glass-settings-content"

    const settingsHeader = document.createElement("div")
    settingsHeader.id = "glass-settings-header"
    settingsHeader.innerHTML = "<h2>Настройки</h2>"

    const settingsClose = document.createElement("button")
    settingsClose.id = "glass-settings-close"
    settingsClose.textContent = "✕"
    settingsClose.setAttribute("type", "button") // Явно указываем тип кнопки

    console.log(
      "[GlassPanel] Создана кнопка закрытия модального окна:",
      settingsClose
    )

    // Добавляем прямой обработчик события для кнопки закрытия
    settingsClose.onclick = function (event) {
      console.log(
        "[GlassPanel] Кнопка закрытия модального окна нажата (onclick)"
      )
      event.preventDefault()
      event.stopPropagation() // Предотвращаем всплытие события
      closeSettingsModal()
      return false // Дополнительно предотвращаем действие по умолчанию
    }

    settingsHeader.appendChild(settingsClose)

    const settingsBody = document.createElement("div")
    settingsBody.id = "glass-settings-body"

    // Содержимое настроек с выбором типа таймера
    settingsBody.innerHTML = `
      <div class="settings-section">
        <h3>Настройки таймера</h3>
        <div class="settings-group">
          <label>Тип таймера:</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="timer-type" value="static" ${
                timerSettings.timerType === "static" ? "checked" : ""
              }>
              Таймер ожидания клиента (3 минуты)
            </label>
            <label>
              <input type="radio" name="timer-type" value="custom" ${
                timerSettings.timerType === "custom" ? "checked" : ""
              }>
              Настраиваемый таймер
            </label>
          </div>
        </div>
        
        <div id="custom-timer-settings" class="settings-group" ${
          timerSettings.timerType === "static" ? 'style="display:none"' : ""
        }>
          <label>Режим таймера:</label>
          <div class="radio-group">
            <label>
              <input type="radio" name="timer-direction" value="down" ${
                timerSettings.customTimerDirection === "down" ? "checked" : ""
              }>
              Обратный отсчет
            </label>
            <label>
              <input type="radio" name="timer-direction" value="up" ${
                timerSettings.customTimerDirection === "up" ? "checked" : ""
              }>
              Прямой отсчет
            </label>
          </div>
          
          <div id="countdown-settings" ${
            timerSettings.customTimerDirection === "up"
              ? 'style="display:none"'
              : ""
          }>
            <label for="custom-timer-settings-input">Время (в минутах):</label>
            <input type="number" id="custom-timer-minutes" min="0" value="${Math.floor(
              timerSettings.customTimerRemainingSeconds / 60
            )}">
            
            <label for="yellow-warning-time">Желтое предупреждение (секунды):</label>
            <input type="number" id="yellow-warning-time" min="0" value="${
              timerSettings.customTimerYellowWarningSeconds
            }">
            
            <label for="red-warning-time">Красное предупреждение (секунды):</label>
            <input type="number" id="red-warning-time" min="0" value="${
              timerSettings.customTimerRedWarningSeconds
            }">
          </div>
        </div>
      </div>
      
      <div class="settings-footer">
        <button id="settings-save">Сохранить</button>
        <button id="settings-cancel">Отмена</button>
      </div>
    `

    settingsContent.appendChild(settingsHeader)
    settingsContent.appendChild(settingsBody)
    settingsModal.appendChild(settingsContent)

    // Добавляем обработчик клика для закрытия модального окна при клике вне его
    settingsModal.addEventListener("click", function (event) {
      if (event.target === settingsModal) {
        console.log(
          "[GlassPanel] Клик вне содержимого модального окна, закрываем"
        )
        closeSettingsModal()
      }
    })

    // Добавляем в конец body
    console.log("[GlassPanel] document.body доступен, добавляем модальное окно")
    document.body.appendChild(settingsModal)

    // Добавляем обработчики для настроек таймера
    setupTimerSettingsListeners(settingsModal)

    console.log("[GlassPanel] Модальное окно успешно создано")
    return settingsModal
  } catch (error) {
    console.error("[GlassPanel] Ошибка при создании модального окна:", error)
    return null
  }
}

// Настройка обработчиков событий для настроек таймера
function setupTimerSettingsListeners(modal) {
  // Переключение между типами таймера
  const timerTypeRadios = modal.querySelectorAll('input[name="timer-type"]')
  timerTypeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const customTimerSettings = modal.querySelector("#custom-timer-settings")
      if (e.target.value === "custom") {
        customTimerSettings.style.display = "block"
      } else {
        customTimerSettings.style.display = "none"
      }
    })
  })

  // Переключение между режимами таймера
  const timerDirectionRadios = modal.querySelectorAll(
    'input[name="timer-direction"]'
  )
  timerDirectionRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const countdownSettings = modal.querySelector("#countdown-settings")
      if (e.target.value === "down") {
        countdownSettings.style.display = "block"
      } else {
        countdownSettings.style.display = "none"
      }
    })
  })

  // Обработчик сохранения настроек
  const saveButton = modal.querySelector("#settings-save")
  if (saveButton) {
    saveButton.addEventListener("click", () => {
      // Получаем значения полей
      const type = modal.querySelector('input[name="timer-type"]:checked').value

      // Обновляем тип таймера
      timerSettings.timerType = type

      if (type === "custom") {
        // Дополнительные настройки для пользовательского таймера
        const direction = modal.querySelector(
          'input[name="timer-direction"]:checked'
        ).value
        timerSettings.customTimerDirection = direction

        if (direction === "down") {
          const minutes =
            parseInt(modal.querySelector("#custom-timer-minutes").value) || 0
          timerSettings.customTimerRemainingSeconds = minutes * 60

          timerSettings.customTimerYellowWarningSeconds =
            parseInt(modal.querySelector("#yellow-warning-time").value) || 30
          timerSettings.customTimerRedWarningSeconds =
            parseInt(modal.querySelector("#red-warning-time").value) || 10
        } else {
          // Для прямого отсчета начинаем с 0
          timerSettings.customTimerRemainingSeconds = 0
        }
      } else {
        // Для статического таймера сбрасываем к 3 минутам
        timerSettings.staticTimerRemainingSeconds = 180
      }

      // Сбрасываем таймер и обновляем его отображение
      resetTimer()

      // Сохраняем настройки таймера и синхронизируем с другими вкладками
      syncTimerSettings()

      // Закрываем модальное окно
      closeSettingsModal()
    })
  }

  // Обработчик отмены
  const cancelButton = modal.querySelector("#settings-cancel")
  if (cancelButton) {
    cancelButton.addEventListener("click", closeSettingsModal)
  }
}

/**
 * Закрывает модальное окно настроек
 */
function closeSettingsModal() {
  console.log("[GlassPanel] Вызвана функция closeSettingsModal")

  try {
    const modal = document.getElementById("glass-settings-modal")

    if (modal) {
      console.log("[GlassPanel] Удаляем модальное окно из DOM")
      modal.parentNode.removeChild(modal)
      console.log("[GlassPanel] Модальное окно удалено из DOM")
    } else {
      console.log("[GlassPanel] Модальное окно не найдено для закрытия")
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при закрытии модального окна:", error)
  }
}

// Глобальный обработчик нажатия клавиши Escape для закрытия модального окна настроек
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    console.log("[GlassPanel] Нажата клавиша Escape, закрываем модальное окно")
    closeSettingsModal()
  }
})

// Функция для обновления обработчиков событий на кнопках
function updateEventListeners() {
  console.log("[GlassPanel] Обновляем обработчики событий")

  // Обработчик для кнопки закрытия панели
  const panelCloseButton = document.getElementById("glass-panel-close")
  if (panelCloseButton) {
    // Сначала удалим все обработчики событий
    const newPanelCloseButton = panelCloseButton.cloneNode(true)
    panelCloseButton.parentNode.replaceChild(
      newPanelCloseButton,
      panelCloseButton
    )

    // Добавим новый обработчик
    newPanelCloseButton.addEventListener("click", function (event) {
      console.log("[GlassPanel] Нажата кнопка закрытия панели")
      event.stopPropagation() // Предотвращаем всплытие события

      // Останавливаем таймер
      if (timerInterval) {
        clearInterval(timerInterval)
        timerInterval = null
      }

      // Удаляем эффекты границ, если они есть
      removeBorderEffect()

      // Отправляем сообщение в background.js о закрытии панели
      try {
        chrome.runtime.sendMessage(
          { action: "closePanel" },
          function (response) {
            if (chrome.runtime.lastError) {
              console.log(
                `[GlassPanel] Ошибка при отправке closePanel: ${chrome.runtime.lastError.message}`
              )
            } else if (response) {
              console.log("[GlassPanel] Ответ на closePanel:", response)
            }
          }
        )
      } catch (error) {
        console.error(
          "[GlassPanel] Ошибка при отправке сообщения closePanel:",
          error
        )
      }
    })
    console.log("[GlassPanel] Обновлен обработчик для кнопки закрытия панели")
  }

  // Обработчик для кнопки настроек
  const settingsButton = document.getElementById("glass-panel-settings")
  if (settingsButton) {
    // Сначала удалим все обработчики событий
    const newSettingsButton = settingsButton.cloneNode(true)
    settingsButton.parentNode.replaceChild(newSettingsButton, settingsButton)

    // Добавим новый обработчик - исправляем ошибку, вместо openSettingsModal используем createSettingsModal
    newSettingsButton.addEventListener("click", function (event) {
      console.log("[GlassPanel] Нажата кнопка настроек")
      event.stopPropagation() // Предотвращаем всплытие события

      // Создаем модальное окно и показываем его
      let modal = createSettingsModal()
      if (modal) {
        modal.style.display = "flex"
      }
    })
    console.log("[GlassPanel] Обновлен обработчик для кнопки настроек")
  }
}

/**
 * Открывает модальное окно настроек
 */
function openSettingsModal() {
  console.log("[GlassPanel] Вызвана функция openSettingsModal")

  try {
    let modal = document.getElementById("glass-settings-modal")

    if (!modal) {
      console.log("[GlassPanel] Модальное окно не существует, создаем")
      modal = createSettingsModal()
      if (!modal) {
        console.error("[GlassPanel] Не удалось создать модальное окно")
        return
      }
    }

    console.log("[GlassPanel] Отображаем модальное окно")
    modal.style.display = "flex"
  } catch (error) {
    console.error("[GlassPanel] Ошибка при открытии модального окна:", error)
  }
}

// Регистрируем настройки
glassPanel.settings = {
  createModal: createSettingsModal,
  openSettingsModal: openSettingsModal,
  closeSettingsModal: closeSettingsModal,
}

console.log("[GlassPanel] Модуль settings инициализирован", glassPanel.settings)

// Реализация timers.js
// ===================================
// Функции для работы с таймером
console.log("[GlassPanel] Инициализация модуля timers")

// Глобальная переменная для интервала таймера
let timerInterval = null

// Создаем эффект неона для страницы
function createBorderEffect(color, blinking = false) {
  // Удаляем существующий эффект, если есть
  const existingEffect = document.getElementById("timer-border-effect")
  if (existingEffect) {
    existingEffect.remove()
  }

  // Создаем элемент для эффекта рамки
  const effectElement = document.createElement("div")
  effectElement.id = "timer-border-effect"
  effectElement.style.position = "fixed"
  effectElement.style.top = "0"
  effectElement.style.left = "0"
  effectElement.style.right = "0"
  effectElement.style.bottom = "0"
  effectElement.style.pointerEvents = "none"
  effectElement.style.zIndex = "2147483646" // Чуть ниже, чем у панели
  effectElement.style.boxShadow = `inset 0 0 20px 3px ${color}`
  effectElement.style.transition = "box-shadow 0.3s ease"

  if (blinking) {
    // Если нужен мигающий эффект
    effectElement.style.animation =
      "neon-blink 0.5s ease-in-out infinite alternate"

    // Добавляем стиль для анимации, если его еще нет
    if (!document.getElementById("neon-blink-style")) {
      const style = document.createElement("style")
      style.id = "neon-blink-style"
      style.textContent = `
        @keyframes neon-blink {
          from { opacity: 1; }
          to { opacity: 0.6; }
        }
      `
      document.head.appendChild(style)
    }
  }

  document.body.appendChild(effectElement)

  return effectElement
}

// Удаляем эффект неона
function removeBorderEffect() {
  const effect = document.getElementById("timer-border-effect")
  if (effect) {
    effect.remove()
  }
}

// Показываем уведомление о завершении таймера
function showTimeoutNotification() {
  // Проверяем, не показано ли уже уведомление
  if (document.getElementById("timer-notification")) {
    return
  }

  const notification = document.createElement("div")
  notification.id = "timer-notification"
  notification.textContent = "Время истекло!"
  notification.style.position = "fixed"
  notification.style.top = "60px" // Под панелью
  notification.style.left = "50%"
  notification.style.transform = "translateX(-50%)"
  notification.style.background = "rgba(255, 50, 50, 0.9)"
  notification.style.color = "white"
  notification.style.padding = "15px 25px"
  notification.style.borderRadius = "5px"
  notification.style.zIndex = "2147483647"
  notification.style.boxShadow = "0 5px 15px rgba(0, 0, 0, 0.3)"
  notification.style.animation = "notification-fade-in 0.3s ease-out"

  // Добавляем стиль для анимации, если его еще нет
  if (!document.getElementById("notification-animations")) {
    const style = document.createElement("style")
    style.id = "notification-animations"
    style.textContent = `
      @keyframes notification-fade-in {
        from { opacity: 0; transform: translate(-50%, -10px); }
        to { opacity: 1; transform: translate(-50%, 0); }
      }
      @keyframes notification-fade-out {
        from { opacity: 1; transform: translate(-50%, 0); }
        to { opacity: 0; transform: translate(-50%, -10px); }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(notification)

  // Удаляем уведомление через 3 секунды
  setTimeout(() => {
    notification.style.animation = "notification-fade-out 0.3s ease-in"
    setTimeout(() => {
      if (notification && notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 3000)
}

// Форматирование времени в формат MM:SS или HH:MM:SS
function formatTime(totalSeconds, includeHours = false) {
  let hours = Math.floor(totalSeconds / 3600)
  let minutes = Math.floor((totalSeconds % 3600) / 60)
  let seconds = totalSeconds % 60

  if (includeHours || hours > 0) {
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
  } else {
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`
  }
}

// Обновление отображения таймера
function updateTimerDisplay() {
  const timerDisplay = document.querySelector(".timer-display")
  if (!timerDisplay) return

  let secondsRemaining
  let includeHours = false

  // Определяем какой таймер отображать
  if (timerSettings.timerType === "static") {
    secondsRemaining = timerSettings.staticTimerRemainingSeconds
  } else {
    // custom
    secondsRemaining = timerSettings.customTimerRemainingSeconds
    // Для настраиваемого таймера проверяем, нужно ли включать часы
    includeHours =
      (timerSettings.customTimerDirection === "down" &&
        timerSettings.customTimerRemainingSeconds >= 3600) ||
      (timerSettings.customTimerDirection === "up" &&
        timerSettings.customTimerRemainingSeconds >= 3600)
  }

  // Форматируем и отображаем время
  timerDisplay.textContent = formatTime(secondsRemaining, includeHours)

  // Вместо встроенной логики визуальных эффектов, вызываем отдельную функцию
  applyVisualEffects()

  // Обновляем состояние кнопок
  updateButtonStates()
}

// Обновление состояния кнопок в соответствии с состоянием таймера
function updateButtonStates() {
  const startBtn = document.querySelector(".start-btn")
  const pauseBtn = document.querySelector(".pause-btn")

  if (startBtn) startBtn.disabled = timerSettings.isTimerRunning
  if (pauseBtn) pauseBtn.disabled = !timerSettings.isTimerRunning
}

// Отслеживаем видимость вкладки для корректной работы таймера
document.addEventListener("visibilitychange", handleVisibilityChange)

// Обработчик изменения видимости вкладки
function handleVisibilityChange() {
  console.log(
    `[GlassPanel] Видимость вкладки изменилась: ${document.visibilityState}`
  )

  // Если вкладка стала активной и таймер запущен, синхронизируем с сервером
  if (document.visibilityState === "visible" && timerSettings.isTimerRunning) {
    requestTimerSettings()
  }
}

// Функции управления таймером
function startTimer() {
  if (timerSettings.isTimerRunning) return

  // Запрашиваем ID текущей вкладки
  chrome.runtime.sendMessage({ action: "getTabId" }, function (response) {
    if (response && response.tabId) {
      timerSettings.isTimerRunning = true
      timerSettings.pausedAt = null

      // Устанавливаем текущую вкладку как управляющую таймером
      timerSettings.controlTabId = response.tabId
      timerSettings.lastUpdateTime = Date.now()
      timerSettings.timerStartTimestamp = Date.now()

      // Запускаем таймер
      if (!timerInterval) {
        timerInterval = setInterval(() => {
          updateTimerBasedOnElapsedTime()
        }, 1000)
      }

      // Обновляем вид кнопок
      updateButtonStates()

      // Синхронизируем состояние таймера с другими вкладками сразу после запуска
      syncTimerSettings()
    }
  })
}

// Обновление таймера на основе реально прошедшего времени
function updateTimerBasedOnElapsedTime() {
  // Если таймер не запущен, выходим
  if (!timerSettings.isTimerRunning) return

  // Текущее время
  const currentTime = Date.now()

  // Расчет прошедшего времени в секундах с момента запуска таймера
  const elapsedSeconds = Math.floor(
    (currentTime - timerSettings.timerStartTimestamp) / 1000
  )

  // Обновляем состояние таймера на основе прошедшего времени
  if (timerSettings.timerType === "static") {
    // Для статического таймера вычитаем прошедшее время из начального значения
    const initialTime = 180 // 3 минуты
    timerSettings.staticTimerRemainingSeconds = Math.max(
      0,
      initialTime - elapsedSeconds
    )
  } else if (timerSettings.customTimerDirection === "down") {
    // Для пользовательского таймера с обратным отсчетом
    const initialTime =
      timerSettings.customTimerRemainingSeconds + elapsedSeconds // Начальное значение
    timerSettings.customTimerRemainingSeconds = Math.max(
      0,
      initialTime - elapsedSeconds
    )
  } else {
    // Для пользовательского таймера с прямым отсчетом
    timerSettings.customTimerRemainingSeconds = elapsedSeconds
  }

  // Обновляем время последнего обновления
  timerSettings.lastUpdateTime = currentTime

  // Обновляем отображение
  updateTimerDisplay()

  // Синхронизируем с другими вкладками
  syncTimerSettings()
}

function pauseTimer() {
  if (!timerSettings.isTimerRunning) return

  timerSettings.isTimerRunning = false

  if (timerInterval) {
    clearInterval(timerInterval)
    timerInterval = null
  }

  // Сохраняем время паузы для синхронизации
  timerSettings.pausedAt = Date.now()

  // Обновляем вид кнопок
  updateButtonStates()

  // Синхронизируем состояние таймера с другими вкладками
  syncTimerSettings()
}

function resetTimer() {
  // Останавливаем таймер
  if (timerSettings.isTimerRunning) {
    clearInterval(timerInterval)
    timerInterval = null
    timerSettings.isTimerRunning = false
  }

  // Сбрасываем время запуска таймера
  timerSettings.timerStartTimestamp = 0

  // Сбрасываем время в зависимости от типа таймера
  if (timerSettings.timerType === "static") {
    timerSettings.staticTimerRemainingSeconds = 180 // 3 минуты
  } else if (timerSettings.customTimerDirection === "down") {
    // Пользовательский таймер с обратным отсчетом - берем значение из настроек
    const customMinutes =
      parseInt(document.querySelector("#custom-timer-minutes")?.value) || 0
    timerSettings.customTimerRemainingSeconds = customMinutes * 60
  } else {
    // Пользовательский таймер с прямым отсчетом - начинаем с 0
    timerSettings.customTimerRemainingSeconds = 0
  }

  // Убираем эффекты
  removeBorderEffect()

  // Обновляем отображение
  updateTimerDisplay()

  // Сбрасываем состояние кнопок
  updateButtonStates()

  // Синхронизируем с другими вкладками
  syncTimerSettings()
}

function stopTimer() {
  pauseTimer()
}

// Синхронизация настроек таймера между вкладками
function syncTimerSettings() {
  // Отправляем текущие настройки в background.js для синхронизации
  try {
    chrome.runtime.sendMessage(
      {
        action: "syncTimerSettings",
        settings: timerSettings,
      },
      function (response) {
        if (chrome.runtime.lastError) {
          console.log(
            `[GlassPanel] Ошибка при синхронизации таймера: ${chrome.runtime.lastError.message}`
          )
        } else if (response) {
          console.log("[GlassPanel] Ответ на синхронизацию таймера:", response)
        }
      }
    )
  } catch (error) {
    console.error("[GlassPanel] Ошибка при отправке настроек таймера:", error)
  }
}

// Инициализация таймера и обработчиков событий
function initTimer() {
  console.log("[GlassPanel] Инициализация таймера")

  // Добавляем обработчики событий для кнопок таймера
  const timerStart = document.querySelector(".start-btn")
  const timerPause = document.querySelector(".pause-btn")
  const timerReset = document.querySelector(".reset-btn")

  if (timerStart) timerStart.addEventListener("click", startTimer)
  if (timerPause) timerPause.addEventListener("click", pauseTimer)
  if (timerReset) timerReset.addEventListener("click", resetTimer)

  // Инициализация дисплея таймера
  updateTimerDisplay()

  // Делаем кнопку паузы изначально неактивной
  updateButtonStates()

  // Запрашиваем актуальные настройки таймера у background.js
  requestTimerSettings()
}

// Запрос актуальных настроек таймера от background.js
function requestTimerSettings() {
  try {
    chrome.runtime.sendMessage(
      { action: "getTimerSettings" },
      function (response) {
        if (chrome.runtime.lastError) {
          console.log(
            `[GlassPanel] Ошибка при запросе настроек таймера: ${chrome.runtime.lastError.message}`
          )
        } else if (response && response.settings) {
          console.log(
            "[GlassPanel] Получены настройки таймера:",
            response.settings
          )

          // Обновляем настройки таймера
          handleTimerSettingsUpdate(response.settings)
        }
      }
    )
  } catch (error) {
    console.error("[GlassPanel] Ошибка при запросе настроек таймера:", error)
  }
}

// Обработка обновления настроек таймера от background.js
function handleTimerSettingsUpdate(settings) {
  console.log("[GlassPanel] Получены обновленные настройки таймера:", settings)

  // Проверяем, является ли текущая вкладка управляющей
  chrome.runtime.sendMessage({ action: "getTabId" }, function (response) {
    if (response && response.tabId) {
      const currentTabId = response.tabId
      const isControlTab = currentTabId === settings.controlTabId

      // Проверяем, насколько актуальны полученные настройки
      if (settings.lastUpdateTime > timerSettings.lastUpdateTime) {
        // Сохраняем старые значения для сравнения
        const wasRunning = timerSettings.isTimerRunning
        const oldStartTimestamp = timerSettings.timerStartTimestamp

        // Обновляем настройки таймера, так как они более свежие
        timerSettings = settings

        // Если изменился статус таймера или время старта, обновляем интервал
        if (
          wasRunning !== timerSettings.isTimerRunning ||
          oldStartTimestamp !== timerSettings.timerStartTimestamp
        ) {
          // Если таймер был запущен, нужно его перезапустить с новыми настройками
          if (timerInterval) {
            clearInterval(timerInterval)
            timerInterval = null
          }

          // Если теперь это управляющая вкладка и таймер должен работать, запускаем интервал
          if (isControlTab && timerSettings.isTimerRunning) {
            timerInterval = setInterval(() => {
              updateTimerBasedOnElapsedTime()
            }, 1000)
          }
        }
      }

      // Обновляем отображение таймера всегда
      updateTimerDisplay()

      // Если управляющая вкладка закрылась, и таймер все ещё запущен,
      // текущая вкладка может стать новой управляющей
      if (timerSettings.isTimerRunning && !timerSettings.controlTabId) {
        timerSettings.controlTabId = currentTabId
        timerSettings.lastUpdateTime = Date.now()

        // Запускаем таймер на этой вкладке
        if (!timerInterval) {
          timerInterval = setInterval(() => {
            updateTimerBasedOnElapsedTime()
          }, 1000)
        }

        // Синхронизируем настройки
        syncTimerSettings()
      }
    }

    // Явно применяем визуальные эффекты по текущему состоянию таймера
    applyVisualEffects()
  })
}

// Применение визуальных эффектов по текущему состоянию таймера
function applyVisualEffects() {
  let secondsRemaining

  if (timerSettings.timerType === "static") {
    secondsRemaining = timerSettings.staticTimerRemainingSeconds

    // Визуальные эффекты для статического таймера
    if (secondsRemaining <= 0) {
      // Останавливаем таймер
      if (timerSettings.isTimerRunning) {
        stopTimer()
      }

      // Показываем уведомление, если время вышло
      if (!document.getElementById("timer-notification")) {
        showTimeoutNotification()
      }
      removeBorderEffect()
    } else if (secondsRemaining <= 10) {
      createBorderEffect("#ff4d4d", true) // Красный мигающий эффект
    } else if (secondsRemaining <= 30) {
      createBorderEffect("#ffcc00") // Желтый эффект
    } else {
      removeBorderEffect() // Убираем эффект
    }
  } else if (
    timerSettings.timerType === "custom" &&
    timerSettings.customTimerDirection === "down"
  ) {
    secondsRemaining = timerSettings.customTimerRemainingSeconds

    // Визуальные эффекты для пользовательского таймера с обратным отсчетом
    if (secondsRemaining <= 0) {
      // Останавливаем таймер
      if (timerSettings.isTimerRunning) {
        stopTimer()
      }

      // Показываем уведомление, если время вышло
      if (!document.getElementById("timer-notification")) {
        showTimeoutNotification()
      }
      removeBorderEffect()
    } else if (secondsRemaining <= timerSettings.customTimerRedWarningSeconds) {
      createBorderEffect("#ff4d4d", true) // Красный мигающий эффект
    } else if (
      secondsRemaining <= timerSettings.customTimerYellowWarningSeconds
    ) {
      createBorderEffect("#ffcc00") // Желтый эффект
    } else {
      removeBorderEffect() // Убираем эффект
    }
  } else if (
    timerSettings.timerType === "custom" &&
    timerSettings.customTimerDirection === "up"
  ) {
    // Для таймера с прямым отсчетом просто убираем рамку
    removeBorderEffect()
  }
}

// Перед закрытием вкладки передаем управление другой вкладке
window.addEventListener("beforeunload", function () {
  // Проверяем, является ли текущая вкладка управляющей
  chrome.runtime.sendMessage({ action: "getTabId" }, function (response) {
    if (
      response &&
      response.tabId &&
      timerSettings.controlTabId === response.tabId
    ) {
      console.log(
        "[GlassPanel] Управляющая вкладка закрывается, передаем управление"
      )

      // Сбрасываем controlTabId, чтобы другая вкладка могла взять управление
      timerSettings.controlTabId = null
      timerSettings.lastUpdateTime = Date.now()

      // Синхронизируем настройки перед закрытием
      try {
        chrome.runtime.sendMessage({
          action: "syncTimerSettings",
          settings: timerSettings,
          tabClosing: true,
        })
      } catch (e) {
        console.error(
          "[GlassPanel] Ошибка при синхронизации при закрытии вкладки:",
          e
        )
      }
    }
  })
})

// Регистрируем таймер
glassPanel.timers = {
  init: initTimer,
  start: startTimer,
  pause: pauseTimer,
  reset: resetTimer,
  update: updateTimerDisplay,
  sync: syncTimerSettings,
  handleSettingsUpdate: handleTimerSettingsUpdate,
  applyVisualEffects: applyVisualEffects,
}

console.log("[GlassPanel] Модуль timers инициализирован", glassPanel.timers)

// Основная инициализация
// ===================================

// Переменная для хранения отложенного отображения панели
let pendingShowPanel = null

// Функция обработки сообщения о переключении панели
function handleTogglePanel(show) {
  console.log(`[GlassPanel] handleTogglePanel вызван с параметром show=${show}`)

  try {
    // Приводим к булевому типу для уверенности
    show = show === true

    console.log("[GlassPanel] glassPanel доступен:", !!glassPanel)
    console.log("[GlassPanel] glassPanel.panel доступен:", !!glassPanel.panel)

    if (glassPanel && glassPanel.panel) {
      console.log("[GlassPanel] Вызываем функцию toggle, show=", show)

      // Убеждаемся, что toggle выполняется только с булевыми значениями
      glassPanel.panel.toggle(show)
    } else {
      console.error("[GlassPanel] glassPanel или glassPanel.panel недоступны!")
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при обработке togglePanel:", error)
  }
}

// Функция для проверки текущего состояния панели у background.js
function checkPanelState() {
  console.log("[GlassPanel] Проверяем состояние панели при загрузке")
  try {
    chrome.runtime.sendMessage(
      { action: "checkPanelState" },
      function (response) {
        if (chrome.runtime.lastError) {
          console.log(
            `[GlassPanel] Ошибка при запросе состояния панели: ${chrome.runtime.lastError.message}`
          )
          // В случае ошибки, скрываем панель для перестраховки
          handleTogglePanel(false)
          return
        }

        console.log(`[GlassPanel] Получен ответ о состоянии панели:`, response)

        // Проверяем ответ и преобразуем в булево значение
        const shouldShowPanel = response && response.show === true
        console.log(
          `[GlassPanel] Итоговое состояние панели: ${shouldShowPanel}`
        )

        // Приводим панель в соответствующее состояние
        handleTogglePanel(shouldShowPanel)
      }
    )
  } catch (error) {
    console.error("[GlassPanel] Ошибка при проверке состояния панели:", error)
    // В случае ошибки скрываем панель
    handleTogglePanel(false)
  }
}

// Запускаем инициализацию в зависимости от состояния документа
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log(
    `[GlassPanel] Документ уже загружен (readyState = ${document.readyState}), инициализируем сразу`
  )
  // Отложенная инициализация для уверенности, что скрипт полностью загружен
  setTimeout(initContentScript, 100)
} else {
  console.log(
    `[GlassPanel] Документ еще не загружен (readyState = ${document.readyState}), ждем событие DOMContentLoaded`
  )

  // Обработчик для DOMContentLoaded - раньше, чем load
  document.addEventListener("DOMContentLoaded", function () {
    console.log("[GlassPanel] Событие DOMContentLoaded, инициализируем")
    setTimeout(initContentScript, 100)
  })

  // Дополнительный обработчик для события load на случай, если DOMContentLoaded пропущен
  window.addEventListener("load", function () {
    console.log("[GlassPanel] Событие load, проверяем инициализацию")
    if (!isContentScriptInitialized) {
      console.log(
        "[GlassPanel] Скрипт не был инициализирован при DOMContentLoaded, инициализируем сейчас"
      )
      setTimeout(initContentScript, 100)
    }
  })
}
