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

    // Обновляем обработчики событий для кнопок
    updateEventListeners()

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
