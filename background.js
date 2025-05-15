// Фоновый скрипт для управления состоянием панели
console.log("[GlassPanel] Background script загружен")

// Состояние видимости панели
let panelVisible = false
console.log("[GlassPanel] Начальное состояние panelVisible =", panelVisible)

// Функция для проверки возможности отправки сообщения на вкладку
function canInjectContentScript(url) {
  // Проверяем URL на наличие схемы chrome:// и chrome-extension://
  if (!url) return false
  return !url.startsWith("chrome:") && !url.startsWith("chrome-extension:")
}

// Функция для отправки состояния панели на вкладку
function sendPanelState(tabId, url) {
  if (!canInjectContentScript(url)) {
    console.log(
      `[GlassPanel] Пропускаем отправку сообщения на вкладку id=${tabId}, url=${url} (несовместимый URL)`
    )
    return
  }

  console.log(
    `[GlassPanel] Отправляем состояние панели (${panelVisible}) на вкладку id=${tabId}, url=${url}`
  )

  try {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: "togglePanel",
        show: panelVisible,
      },
      (response) => {
        if (chrome.runtime.lastError) {
          console.log(
            `[GlassPanel] Ошибка при отправке сообщения на вкладку ${tabId}: ${chrome.runtime.lastError.message}`
          )

          // Если контент-скрипт еще не загружен, пробуем повторить через небольшую задержку
          setTimeout(() => {
            try {
              chrome.tabs.sendMessage(tabId, {
                action: "togglePanel",
                show: panelVisible,
              })
            } catch (e) {
              console.error(
                `[GlassPanel] Вторая попытка отправки сообщения не удалась: ${e.message}`
              )
            }
          }, 1500)
        } else if (response) {
          console.log(
            `[GlassPanel] Получен ответ от вкладки ${tabId}:`,
            response
          )
        }
      }
    )
  } catch (error) {
    console.error(
      `[GlassPanel] Исключение при отправке сообщения на вкладку ${tabId}:`,
      error
    )
  }
}

// Обработка клика по иконке расширения
chrome.action.onClicked.addListener(() => {
  console.log("[GlassPanel] Клик по иконке расширения")

  // Инвертируем состояние видимости
  panelVisible = !panelVisible
  console.log("[GlassPanel] Новое состояние panelVisible =", panelVisible)

  // Отправляем сообщение всем активным вкладкам
  chrome.tabs.query({}, (tabs) => {
    console.log(
      `[GlassPanel] Отправляем сообщение togglePanel(${panelVisible}) на ${tabs.length} вкладок`
    )

    tabs.forEach((tab) => {
      sendPanelState(tab.id, tab.url)
    })
  })
})

// Отслеживаем изменения в существующих вкладках (навигация)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Проверяем, изменился ли URL и полностью ли загружена вкладка
  if (changeInfo.status === "complete" && tab.url) {
    console.log(
      `[GlassPanel] Обновлена вкладка id=${tabId}, url=${tab.url}, status=${changeInfo.status}`
    )

    // Если панель видима, отправляем статус на обновленную вкладку
    if (panelVisible) {
      // Даем время для загрузки контент-скрипта
      setTimeout(() => {
        sendPanelState(tabId, tab.url)
      }, 500)
    }
  }
})

// Проверяем состояние при создании новой вкладки
chrome.tabs.onCreated.addListener((tab) => {
  console.log(`[GlassPanel] Создана новая вкладка id=${tab.id}`)

  // Если панель в данный момент видима, отправляем сообщение
  if (panelVisible) {
    console.log(
      `[GlassPanel] Отправляем состояние панели на новую вкладку id=${tab.id}`
    )

    // Таймаут для ожидания полной загрузки вкладки перед отправкой сообщения
    setTimeout(() => {
      // Добавляем проверку текущего состояния вкладки
      chrome.tabs.get(tab.id, (updatedTab) => {
        if (chrome.runtime.lastError) {
          console.log(
            `[GlassPanel] Ошибка при получении данных вкладки: ${chrome.runtime.lastError.message}`
          )
          return
        }

        if (updatedTab) {
          sendPanelState(tab.id, updatedTab.url)
        }
      })
    }, 1000) // Увеличиваем время ожидания до 1 секунды
  }
})

// Обработка сообщений от content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[GlassPanel] Получено сообщение:", message)
  console.log("[GlassPanel] Отправитель:", sender)

  if (message.action === "closePanel") {
    console.log("[GlassPanel] Обрабатываем запрос на закрытие панели")
    panelVisible = false

    // Отправляем сообщение всем активным вкладкам о закрытии панели
    chrome.tabs.query({}, (tabs) => {
      console.log(
        `[GlassPanel] Отправляем сообщение togglePanel(false) на ${tabs.length} вкладок для закрытия`
      )

      tabs.forEach((tab) => {
        sendPanelState(tab.id, tab.url)
      })
    })
  } else if (message.action === "checkPanelState") {
    // Отвечаем на запрос о текущем состоянии панели
    console.log(
      `[GlassPanel] Отвечаем на запрос о состоянии панели: ${panelVisible}`
    )
    sendResponse({ show: panelVisible })
    return true
  }

  // Подтверждаем получение сообщения
  console.log("[GlassPanel] Отправляем подтверждение получения сообщения")
  sendResponse({ success: true })
  return true
})
