// Основной контентный скрипт
// Инициализирует работу панели
console.log("[GlassPanel] Content script загружен")

// Глобальные переменные и объекты
const glassPanel = {
  panel: null,
  settings: null,
  timers: null, // Добавляем объект для работы с таймерами
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

    // Добавляем контент в панель с двумя таймерами
    panel.innerHTML = `
      <div id="glass-panel-content">
        <div id="glass-panel-timers">
          <div id="static-timer" class="timer-container">
            <div class="timer-display">03:00</div>
            <div class="timer-controls">
              <button class="timer-btn start-btn">▶</button>
              <button class="timer-btn pause-btn">⏸️</button>
              <button class="timer-btn reset-btn">↺</button>
            </div>
          </div>
          <div id="custom-timer" class="timer-container">
            <div class="timer-display">00:00</div>
            <div class="timer-controls">
              <button class="timer-btn start-btn">▶</button>
              <button class="timer-btn pause-btn">⏸️</button>
              <button class="timer-btn reset-btn">↺</button>
              <button class="timer-btn settings-btn">⚙️</button>
            </div>
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

    // Инициализируем таймеры
    initTimers()

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

    // Пустое содержимое настроек
    settingsBody.innerHTML = `
      <div class="settings-placeholder">
        <p>Настройки будут добавлены позже</p>
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

    console.log("[GlassPanel] Модальное окно успешно создано")
    return settingsModal
  } catch (error) {
    console.error("[GlassPanel] Ошибка при создании модального окна:", error)
    return null
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

    // Проверяем, работает ли кнопка закрытия
    const closeButton = document.getElementById("glass-settings-close")
    if (closeButton) {
      console.log(
        "[GlassPanel] Добавляем дополнительные обработчики для кнопки закрытия модального окна"
      )

      // Устанавливаем прямые атрибуты onclick для обеспечения максимальной совместимости
      closeButton.onclick = function (event) {
        console.log(
          "[GlassPanel] Нажата кнопка закрытия модального окна (через onclick)"
        )
        event.preventDefault()
        event.stopPropagation()
        closeSettingsModal()
        return false
      }

      // Также добавляем стандартный слушатель для надежности
      closeButton.addEventListener(
        "click",
        function (e) {
          console.log(
            "[GlassPanel] Нажата кнопка закрытия модального окна (через addEventListener)"
          )
          e.preventDefault()
          e.stopPropagation()
          closeSettingsModal()
        },
        true
      ) // Используем фазу захвата для перехвата события до его всплытия

      // Делаем кнопку более заметной для отладки
      closeButton.style.boxShadow = "0 0 5px red"

      console.log(
        "[GlassPanel] Обработчики для кнопки закрытия модального окна обновлены"
      )
    } else {
      console.error("[GlassPanel] Кнопка закрытия модального окна не найдена!")
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при открытии модального окна:", error)
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

      // Очищаем все интервалы таймеров перед закрытием
      if (staticTimerInterval) {
        clearInterval(staticTimerInterval)
        staticTimerInterval = null
      }
      if (customTimerInterval) {
        clearInterval(customTimerInterval)
        customTimerInterval = null
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

    // Добавим новый обработчик
    newSettingsButton.addEventListener("click", function (event) {
      console.log("[GlassPanel] Нажата кнопка настроек")
      event.stopPropagation() // Предотвращаем всплытие события
      openSettingsModal()
    })
    console.log("[GlassPanel] Обновлен обработчик для кнопки настроек")
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
// Функции для работы с таймерами
console.log("[GlassPanel] Инициализация модуля timers")

// Глобальные переменные для таймеров
let staticTimerInterval = null
let customTimerInterval = null
let staticTimerRemainingSeconds = 180 // 3 минуты
let customTimerRemainingSeconds = 0
let customTimerDirection = "down" // 'down' или 'up'
let customTimerYellowWarningSeconds = 30
let customTimerRedWarningSeconds = 10
let isStaticTimerRunning = false
let isCustomTimerRunning = false

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

  document.body.appendChild(notification)

  // Удаляем уведомление через 3 секунды
  setTimeout(() => {
    notification.style.animation = "notification-fade-out 0.3s ease-in"
    setTimeout(() => notification.remove(), 300)
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

// Обновление отображения статического таймера
function updateStaticTimerDisplay() {
  const timerDisplay = document.querySelector("#static-timer .timer-display")
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(staticTimerRemainingSeconds)

    // Применяем визуальные эффекты в зависимости от оставшегося времени
    if (staticTimerRemainingSeconds <= 0) {
      stopStaticTimer()
      showTimeoutNotification()
      removeBorderEffect()
    } else if (staticTimerRemainingSeconds <= 10) {
      createBorderEffect("#ff4d4d", true) // Красный мигающий эффект для последних 10 секунд
    } else if (staticTimerRemainingSeconds <= 30) {
      createBorderEffect("#ffcc00") // Желтый эффект для последних 30 секунд
    }
  }
}

// Обновление отображения пользовательского таймера
function updateCustomTimerDisplay() {
  const timerDisplay = document.querySelector("#custom-timer .timer-display")
  if (timerDisplay) {
    // Определяем, нужно ли добавлять часы в формат
    const includeHours =
      (customTimerDirection === "down" &&
        customTimerRemainingSeconds >= 3600) ||
      (customTimerDirection === "up" && customTimerRemainingSeconds >= 3600)

    timerDisplay.textContent = formatTime(
      customTimerRemainingSeconds,
      includeHours
    )

    // Если таймер идет в обратном направлении, проверяем предупреждения
    if (customTimerDirection === "down") {
      if (customTimerRemainingSeconds <= 0) {
        stopCustomTimer()
        showTimeoutNotification()
        removeBorderEffect()
      } else if (customTimerRemainingSeconds <= customTimerRedWarningSeconds) {
        createBorderEffect("#ff4d4d", true) // Красный мигающий эффект
      } else if (
        customTimerRemainingSeconds <= customTimerYellowWarningSeconds
      ) {
        createBorderEffect("#ffcc00") // Желтый эффект
      }
    }
  }
}

// Функции для статического таймера (3 минуты)
function startStaticTimer() {
  if (isStaticTimerRunning) return

  isStaticTimerRunning = true
  staticTimerInterval = setInterval(() => {
    staticTimerRemainingSeconds--
    updateStaticTimerDisplay()
  }, 1000)

  // Обновляем вид кнопок
  const startBtn = document.querySelector("#static-timer .start-btn")
  const pauseBtn = document.querySelector("#static-timer .pause-btn")
  if (startBtn) startBtn.disabled = true
  if (pauseBtn) pauseBtn.disabled = false
}

function pauseStaticTimer() {
  if (!isStaticTimerRunning) return

  isStaticTimerRunning = false
  clearInterval(staticTimerInterval)
  staticTimerInterval = null

  // Обновляем вид кнопок
  const startBtn = document.querySelector("#static-timer .start-btn")
  const pauseBtn = document.querySelector("#static-timer .pause-btn")
  if (startBtn) startBtn.disabled = false
  if (pauseBtn) pauseBtn.disabled = true
}

function resetStaticTimer() {
  pauseStaticTimer()
  staticTimerRemainingSeconds = 180 // 3 минуты
  updateStaticTimerDisplay()
  removeBorderEffect()

  // Сбросим состояние кнопок
  const startBtn = document.querySelector("#static-timer .start-btn")
  const pauseBtn = document.querySelector("#static-timer .pause-btn")
  if (startBtn) startBtn.disabled = false
  if (pauseBtn) pauseBtn.disabled = true
}

function stopStaticTimer() {
  pauseStaticTimer()
}

// Функции для пользовательского таймера
function startCustomTimer() {
  if (isCustomTimerRunning) return

  isCustomTimerRunning = true
  customTimerInterval = setInterval(() => {
    if (customTimerDirection === "down") {
      customTimerRemainingSeconds--
      if (customTimerRemainingSeconds < 0) {
        customTimerRemainingSeconds = 0
        stopCustomTimer()
        showTimeoutNotification()
      }
    } else {
      // up
      customTimerRemainingSeconds++
    }
    updateCustomTimerDisplay()
  }, 1000)

  // Обновляем вид кнопок
  const startBtn = document.querySelector("#custom-timer .start-btn")
  const pauseBtn = document.querySelector("#custom-timer .pause-btn")
  if (startBtn) startBtn.disabled = true
  if (pauseBtn) pauseBtn.disabled = false
}

function pauseCustomTimer() {
  if (!isCustomTimerRunning) return

  isCustomTimerRunning = false
  clearInterval(customTimerInterval)
  customTimerInterval = null

  // Обновляем вид кнопок
  const startBtn = document.querySelector("#custom-timer .start-btn")
  const pauseBtn = document.querySelector("#custom-timer .pause-btn")
  if (startBtn) startBtn.disabled = false
  if (pauseBtn) pauseBtn.disabled = true
}

function resetCustomTimer() {
  pauseCustomTimer()

  // При сбросе устанавливаем начальное значение в зависимости от направления
  if (customTimerDirection === "down") {
    // Если пользователь установил какое-то значение, сбрасываем к нему
    // иначе к 0
    customTimerRemainingSeconds =
      customTimerRemainingSeconds > 0
        ? parseInt(
            document.querySelector("#custom-timer-settings-input").value
          ) * 60 || 0
        : 0
  } else {
    customTimerRemainingSeconds = 0
  }

  updateCustomTimerDisplay()
  removeBorderEffect()

  // Сбросим состояние кнопок
  const startBtn = document.querySelector("#custom-timer .start-btn")
  const pauseBtn = document.querySelector("#custom-timer .pause-btn")
  if (startBtn) startBtn.disabled = false
  if (pauseBtn) pauseBtn.disabled = true
}

function stopCustomTimer() {
  pauseCustomTimer()
}

// Открываем модальное окно настроек пользовательского таймера
function openCustomTimerSettings() {
  console.log("[GlassPanel] Открываем настройки пользовательского таймера")

  // Создаем модальное окно, если его нет
  let modal = document.getElementById("custom-timer-settings-modal")
  if (!modal) {
    modal = document.createElement("div")
    modal.id = "custom-timer-settings-modal"
    modal.className = "timer-settings-modal"

    // Содержимое настроек
    let timeInMinutes = Math.floor(customTimerRemainingSeconds / 60)
    modal.innerHTML = `
      <div class="timer-settings-content">
        <div class="timer-settings-header">
          <h3>Настройки таймера</h3>
          <button id="custom-timer-settings-close">✕</button>
        </div>
        <div class="timer-settings-body">
          <div class="settings-group">
            <label>Режим таймера:</label>
            <div class="radio-group">
              <label>
                <input type="radio" name="timer-direction" value="down" ${
                  customTimerDirection === "down" ? "checked" : ""
                }>
                Обратный отсчет
              </label>
              <label>
                <input type="radio" name="timer-direction" value="up" ${
                  customTimerDirection === "up" ? "checked" : ""
                }>
                Прямой отсчет
              </label>
            </div>
          </div>
          
          <div class="settings-group" id="countdown-settings" ${
            customTimerDirection === "up" ? 'style="display:none"' : ""
          }>
            <label for="custom-timer-settings-input">Время (в минутах):</label>
            <input type="number" id="custom-timer-settings-input" min="0" value="${timeInMinutes}">
            
            <label for="yellow-warning-time">Желтое предупреждение (секунды):</label>
            <input type="number" id="yellow-warning-time" min="0" value="${customTimerYellowWarningSeconds}">
            
            <label for="red-warning-time">Красное предупреждение (секунды):</label>
            <input type="number" id="red-warning-time" min="0" value="${customTimerRedWarningSeconds}">
          </div>
          
          <div class="settings-footer">
            <button id="custom-timer-settings-save">Сохранить</button>
            <button id="custom-timer-settings-cancel">Отмена</button>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(modal)

    // Обработчики событий
    modal
      .querySelector("#custom-timer-settings-close")
      .addEventListener("click", closeCustomTimerSettings)
    modal
      .querySelector("#custom-timer-settings-cancel")
      .addEventListener("click", closeCustomTimerSettings)

    // Обработчик сохранения настроек
    modal
      .querySelector("#custom-timer-settings-save")
      .addEventListener("click", () => {
        // Получаем значения полей
        const direction = modal.querySelector(
          'input[name="timer-direction"]:checked'
        ).value
        customTimerDirection = direction

        if (direction === "down") {
          const minutes =
            parseInt(
              modal.querySelector("#custom-timer-settings-input").value
            ) || 0
          customTimerRemainingSeconds = minutes * 60

          customTimerYellowWarningSeconds =
            parseInt(modal.querySelector("#yellow-warning-time").value) || 30
          customTimerRedWarningSeconds =
            parseInt(modal.querySelector("#red-warning-time").value) || 10
        } else {
          customTimerRemainingSeconds = 0
        }

        // Обновляем отображение
        updateCustomTimerDisplay()
        closeCustomTimerSettings()
      })

    // Переключение отображения настроек обратного отсчета
    const directionRadios = modal.querySelectorAll(
      'input[name="timer-direction"]'
    )
    directionRadios.forEach((radio) => {
      radio.addEventListener("change", (e) => {
        const countdownSettings = modal.querySelector("#countdown-settings")
        if (e.target.value === "down") {
          countdownSettings.style.display = "block"
        } else {
          countdownSettings.style.display = "none"
        }
      })
    })
  } else {
    // Если окно уже существует, просто показываем его
    modal.style.display = "flex"
  }
}

// Закрываем модальное окно настроек пользовательского таймера
function closeCustomTimerSettings() {
  const modal = document.getElementById("custom-timer-settings-modal")
  if (modal) {
    modal.remove()
  }
}

// Инициализация таймеров и обработчиков событий
function initTimers() {
  console.log("[GlassPanel] Инициализация таймеров")

  // Добавляем обработчики событий для статического таймера
  const staticTimerStart = document.querySelector("#static-timer .start-btn")
  const staticTimerPause = document.querySelector("#static-timer .pause-btn")
  const staticTimerReset = document.querySelector("#static-timer .reset-btn")

  if (staticTimerStart)
    staticTimerStart.addEventListener("click", startStaticTimer)
  if (staticTimerPause)
    staticTimerPause.addEventListener("click", pauseStaticTimer)
  if (staticTimerReset)
    staticTimerReset.addEventListener("click", resetStaticTimer)

  // Добавляем обработчики событий для пользовательского таймера
  const customTimerStart = document.querySelector("#custom-timer .start-btn")
  const customTimerPause = document.querySelector("#custom-timer .pause-btn")
  const customTimerReset = document.querySelector("#custom-timer .reset-btn")
  const customTimerSettings = document.querySelector(
    "#custom-timer .settings-btn"
  )

  if (customTimerStart)
    customTimerStart.addEventListener("click", startCustomTimer)
  if (customTimerPause)
    customTimerPause.addEventListener("click", pauseCustomTimer)
  if (customTimerReset)
    customTimerReset.addEventListener("click", resetCustomTimer)
  if (customTimerSettings)
    customTimerSettings.addEventListener("click", openCustomTimerSettings)

  // Инициализация дисплеев таймеров
  updateStaticTimerDisplay()
  updateCustomTimerDisplay()

  // Делаем кнопки паузы изначально неактивными
  const staticPauseBtn = document.querySelector("#static-timer .pause-btn")
  const customPauseBtn = document.querySelector("#custom-timer .pause-btn")
  if (staticPauseBtn) staticPauseBtn.disabled = true
  if (customPauseBtn) customPauseBtn.disabled = true
}

// Регистрируем таймеры
glassPanel.timers = {
  init: initTimers,
  startStaticTimer,
  pauseStaticTimer,
  resetStaticTimer,
  startCustomTimer,
  pauseCustomTimer,
  resetCustomTimer,
  openCustomTimerSettings,
  closeCustomTimerSettings,
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

// После загрузки страницы проверяем состояние панели
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log(
    `[GlassPanel] Документ уже загружен (readyState = ${document.readyState}), инициализируем сразу`
  )
  // Отключаем автоматическое создание модального окна настроек
  // if (glassPanel && glassPanel.settings) {
  //   glassPanel.settings.createModal()
  // }

  // Проверяем состояние панели
  checkPanelState()
} else {
  console.log(
    `[GlassPanel] Документ еще не загружен (readyState = ${document.readyState}), ждем событие load`
  )
  window.addEventListener("load", function () {
    console.log("[GlassPanel] Документ загружен, инициализируем")
    // Отключаем автоматическое создание модального окна настроек
    // if (glassPanel && glassPanel.settings) {
    //   glassPanel.settings.createModal()
    // }

    // Проверяем состояние панели после загрузки страницы
    checkPanelState()
  })
}

// Обработка сообщений от background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[GlassPanel] Получено сообщение:", message)

  try {
    if (message.action === "togglePanel") {
      console.log(`[GlassPanel] Обрабатываем togglePanel, show=${message.show}`)

      // Убеждаемся, что статус правильно установлен
      const shouldShow = !!message.show // Приводим к boolean
      console.log(`[GlassPanel] Преобразованный статус show=${shouldShow}`)

      // Вызываем togglePanel с явным указанием show параметра
      handleTogglePanel(shouldShow)

      // Подтверждаем получение с результатом действия
      console.log("[GlassPanel] Отправляем подтверждение обработки togglePanel")
      sendResponse({
        success: true,
        panelVisible: shouldShow,
        timestamp: Date.now(),
      })
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при обработке сообщения:", error)
    sendResponse({ success: false, error: error.message })
  }

  return true
})
