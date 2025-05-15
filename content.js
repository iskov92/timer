// Основной контентный скрипт
// Инициализирует работу панели
console.log("[GlassPanel] Content script загружен")

// Глобальные переменные и объекты
const glassPanel = {
  panel: null,
  settings: null,
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

    // Добавляем контент в панель
    panel.innerHTML =
      '<div id="glass-panel-content">Ваша стеклянная панель</div>'

    // Создаем кнопки
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

    // Добавляем обработчики событий для кнопок
    closeButton.addEventListener("click", function () {
      console.log("[GlassPanel] Нажата кнопка закрытия панели")
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

    settingsButton.addEventListener("click", function () {
      console.log("[GlassPanel] Нажата кнопка настроек")
      // Открываем модальное окно настроек
      try {
        openSettingsModal()
      } catch (error) {
        console.error(
          "[GlassPanel] Ошибка при открытии модального окна настроек:",
          error
        )
      }
    })

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
    console.log("[GlassPanel] Текущая панель:", panel)

    if (!panel && show) {
      console.log(
        "[GlassPanel] Панель не существует и show=true, создаем панель"
      )
      panel = createPanel()
      if (!panel) {
        console.error("[GlassPanel] Не удалось создать панель")
        return
      }
    } else if (!panel) {
      console.log(
        "[GlassPanel] Панель не существует и show=false, ничего не делаем"
      )
      return // Если панель не существует и мы хотим ее скрыть, ничего не делаем
    }

    console.log(`[GlassPanel] Устанавливаем display=${show ? "block" : "none"}`)
    panel.style.display = show ? "block" : "none"

    // Получаем высоту панели и устанавливаем соответствующий отступ
    if (document.body) {
      const panelHeight = show ? (panel.offsetHeight || 50) + "px" : "0"
      console.log(`[GlassPanel] Устанавливаем marginTop=${panelHeight}`)
      document.body.style.marginTop = panelHeight
      document.body.style.transition = "margin-top 0.3s ease" // Добавляем плавный переход
    } else {
      console.error(
        "[GlassPanel] document.body недоступен при установке marginTop"
      )
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

    // Добавляем в конец body
    console.log("[GlassPanel] document.body доступен, добавляем модальное окно")
    document.body.appendChild(settingsModal)

    // Добавляем обработчики событий
    settingsClose.addEventListener("click", function () {
      console.log("[GlassPanel] Нажата кнопка закрытия модального окна")
      closeSettingsModal()
    })

    // Закрытие модального окна при клике вне его содержимого
    settingsModal.addEventListener("click", function (event) {
      if (event.target === settingsModal) {
        console.log(
          "[GlassPanel] Клик вне содержимого модального окна, закрываем"
        )
        closeSettingsModal()
      }
    })

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
      console.log("[GlassPanel] Скрываем модальное окно")
      modal.style.display = "none"
    } else {
      console.log("[GlassPanel] Модальное окно не найдено для закрытия")
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при закрытии модального окна:", error)
  }
}

// Регистрируем настройки
glassPanel.settings = {
  createModal: createSettingsModal,
  openSettingsModal: openSettingsModal,
  closeSettingsModal: closeSettingsModal,
}

console.log("[GlassPanel] Модуль settings инициализирован", glassPanel.settings)

// Основная инициализация
// ===================================

// Переменная для хранения отложенного отображения панели
let pendingShowPanel = null

// Функция обработки сообщения о переключении панели
function handleTogglePanel(show) {
  console.log(`[GlassPanel] handleTogglePanel вызван с параметром show=${show}`)

  try {
    console.log("[GlassPanel] glassPanel доступен:", !!glassPanel)
    console.log("[GlassPanel] glassPanel.panel доступен:", !!glassPanel.panel)

    if (glassPanel && glassPanel.panel) {
      console.log("[GlassPanel] Вызываем функцию toggle, show=", show)
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
          return
        }

        if (response && response.show) {
          console.log(
            `[GlassPanel] Получен ответ о состоянии панели: ${response.show}`
          )
          handleTogglePanel(response.show)
        }
      }
    )
  } catch (error) {
    console.error("[GlassPanel] Ошибка при проверке состояния панели:", error)
  }
}

// После загрузки страницы создаем модальное окно настроек и проверяем состояние панели
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  console.log(
    `[GlassPanel] Документ уже загружен (readyState = ${document.readyState}), инициализируем сразу`
  )
  if (glassPanel && glassPanel.settings) {
    glassPanel.settings.createModal()
  }

  // Проверяем состояние панели
  checkPanelState()
} else {
  console.log(
    `[GlassPanel] Документ еще не загружен (readyState = ${document.readyState}), ждем событие load`
  )
  window.addEventListener("load", function () {
    console.log("[GlassPanel] Документ загружен, инициализируем")
    if (glassPanel && glassPanel.settings) {
      glassPanel.settings.createModal()
    }

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
      handleTogglePanel(message.show)
    }

    // Подтверждаем получение сообщения
    console.log("[GlassPanel] Отправляем подтверждение получения сообщения")
    sendResponse({ success: true })
  } catch (error) {
    console.error("[GlassPanel] Ошибка при обработке сообщения:", error)
    sendResponse({ success: false, error: error.message })
  }

  return true
})
