// Основной фоновый скрипт расширения
// Управляет обработкой событий и обменом сообщениями
console.log("[GlassPanel] Background script запущен")

// Состояние панели
let panelState = {
  show: false,
}

// Настройки таймера (для синхронизации между вкладками)
let timerSettings = {
  timerType: "static", // static или custom
  staticTimerRemainingSeconds: 180, // 3 минуты
  customTimerRemainingSeconds: 0,
  customTimerDirection: "down", // 'down' или 'up'
  customTimerYellowWarningSeconds: 30,
  customTimerRedWarningSeconds: 10,
  isTimerRunning: false,
  pausedAt: null,
  lastUpdated: Date.now(),
}

// Функция для проверки возможности отправки сообщения на вкладку
function canInjectContentScript(url) {
  // Проверяем URL на наличие схемы chrome:// и chrome-extension://
  if (!url) return false
  return (
    !url.startsWith("chrome:") &&
    !url.startsWith("chrome-extension:") &&
    !url.startsWith("about:") &&
    url.startsWith("http")
  )
}

// Функция для отправки сообщения вкладке с повторной попыткой
function sendMessageWithRetry(tabId, message, maxRetries = 2, delay = 500) {
  let attemptCount = 0

  function attemptSend() {
    attemptCount++
    console.log(
      `[GlassPanel] Попытка ${attemptCount} отправки сообщения в таб ${tabId}`
    )

    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        console.log(
          `[GlassPanel] Ошибка при отправке сообщения: ${chrome.runtime.lastError.message}`
        )

        // Если еще есть попытки, пробуем снова
        if (attemptCount < maxRetries) {
          console.log(`[GlassPanel] Повторная попытка через ${delay}мс...`)
          setTimeout(attemptSend, delay)
        } else {
          console.log(
            `[GlassPanel] Достигнуто максимальное количество попыток (${maxRetries})`
          )
        }
      } else {
        console.log(`[GlassPanel] Сообщение успешно отправлено в таб ${tabId}`)
        if (response) {
          console.log(`[GlassPanel] Получен ответ:`, response)
        }
      }
    })
  }

  // Начинаем с первой попытки
  attemptSend()
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
    `[GlassPanel] Отправляем состояние панели (${panelState.show}) на вкладку id=${tabId}, url=${url}`
  )

  try {
    chrome.tabs.sendMessage(
      tabId,
      {
        action: "togglePanel",
        show: panelState.show,
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
                show: panelState.show,
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

// Обработчик клика по иконке расширения
chrome.action.onClicked.addListener((tab) => {
  console.log("[GlassPanel] Клик по иконке расширения")

  try {
    // Переключаем состояние видимости панели
    panelState.show = !panelState.show
    console.log(`[GlassPanel] Новое состояние панели: ${panelState.show}`)

    // Отправляем сообщение во все вкладки для переключения панели
    broadcastMessage({ action: "togglePanel", show: panelState.show })
  } catch (error) {
    console.error("[GlassPanel] Ошибка при обработке клика:", error)
  }
})

// Отслеживаем изменения в существующих вкладках (навигация)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Проверяем, изменился ли URL и полностью ли загружена вкладка
  if (changeInfo.status === "complete" && tab.url) {
    console.log(
      `[GlassPanel] Обновлена вкладка id=${tabId}, url=${tab.url}, status=${changeInfo.status}`
    )

    // Если панель видима, отправляем статус на обновленную вкладку
    if (panelState.show && canInjectContentScript(tab.url)) {
      // Даем время для загрузки контент-скрипта
      setTimeout(() => {
        try {
          console.log(
            `[GlassPanel] Отправляем togglePanel(${panelState.show}) на обновленную вкладку ${tabId}`
          )

          sendMessageWithRetry(
            tabId,
            {
              action: "togglePanel",
              show: panelState.show,
              isTabUpdate: true,
              timestamp: Date.now(),
            },
            3,
            800
          )
        } catch (error) {
          console.error(
            `[GlassPanel] Ошибка при отправке togglePanel на обновленную вкладку ${tabId}:`,
            error
          )
        }
      }, 800)
    }
  }
})

// Проверяем состояние при создании новой вкладки
chrome.tabs.onCreated.addListener((tab) => {
  console.log(`[GlassPanel] Создана новая вкладка id=${tab.id}`)

  // Если панель в данный момент видима, отправляем сообщение
  if (panelState.show) {
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

        if (updatedTab && canInjectContentScript(updatedTab.url)) {
          try {
            console.log(
              `[GlassPanel] Отправляем togglePanel(${panelState.show}) на новую вкладку ${tab.id}`
            )

            // Используем функцию с повторными попытками
            sendMessageWithRetry(
              tab.id,
              {
                action: "togglePanel",
                show: panelState.show,
                isNewTab: true,
                timestamp: Date.now(),
              },
              3,
              1000
            )
          } catch (error) {
            console.error(
              `[GlassPanel] Ошибка при отправке togglePanel на новую вкладку ${tab.id}:`,
              error
            )
          }
        } else {
          console.log(
            `[GlassPanel] Пропускаем отправку на новую вкладку ${tab.id} (несовместимый URL: ${updatedTab.url})`
          )
        }
      })
    }, 1500) // Увеличиваем время ожидания до 1.5 секунды
  }
})

// Обработчик сообщений от content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[GlassPanel] Получено сообщение:", message)
  console.log("[GlassPanel] От отправителя:", sender)

  try {
    // Обработка различных типов сообщений
    if (message.action === "closePanel") {
      console.log("[GlassPanel] Получен запрос на закрытие панели")
      panelState.show = false

      // Отправляем сообщение во все вкладки
      broadcastMessage({ action: "togglePanel", show: false })

      // Отправляем ответ отправителю
      sendResponse({ success: true, timestamp: Date.now() })
    } else if (message.action === "checkPanelState") {
      console.log("[GlassPanel] Получен запрос на проверку состояния панели")
      console.log(`[GlassPanel] Текущее состояние: ${panelState.show}`)

      // Отправляем текущее состояние панели
      sendResponse({ show: panelState.show, timestamp: Date.now() })
    } else if (message.action === "syncTimerSettings") {
      // Получаем обновленные настройки таймера
      if (message.settings) {
        console.log(
          "[GlassPanel] Синхронизация настроек таймера:",
          message.settings
        )

        // Всегда обновляем метку времени последнего обновления
        message.settings.lastUpdated = Date.now()

        // Сохраняем полученные настройки
        timerSettings = message.settings

        // Сразу отправляем обновленные настройки всем вкладкам, включая отправителя
        // чтобы гарантировать, что все вкладки имеют одинаковое состояние таймера
        broadcastMessage({
          action: "updateTimerSettings",
          settings: timerSettings,
          forceSync: true, // Флаг принудительной синхронизации
        })
      }

      // Отправляем ответ отправителю
      sendResponse({
        success: true,
        timestamp: Date.now(),
        settings: timerSettings,
      })
    } else if (message.action === "getTimerSettings") {
      // Отправляем текущие настройки таймера
      console.log("[GlassPanel] Отправляем настройки таймера:", timerSettings)
      sendResponse({ settings: timerSettings, timestamp: Date.now() })
    }
  } catch (error) {
    console.error("[GlassPanel] Ошибка при обработке сообщения:", error)
    sendResponse({ success: false, error: error.message })
  }

  return true // Указываем, что будем отправлять ответ асинхронно
})

// Функция для отправки сообщения во все вкладки
function broadcastMessage(message, excludeTabId = null) {
  try {
    console.log(`[GlassPanel] Отправляем сообщение во все вкладки:`, message)

    // Если есть флаг forceSync и это обновление таймера,
    // то не исключаем вкладку отправителя для полной синхронизации
    const shouldExclude = message.forceSync !== true ? excludeTabId : null

    if (shouldExclude) {
      console.log(`[GlassPanel] Исключая вкладку: ${shouldExclude}`)
    } else {
      console.log(`[GlassPanel] Отправляем всем вкладкам без исключений`)
    }

    chrome.tabs.query({}, (tabs) => {
      console.log(`[GlassPanel] Найдено ${tabs.length} вкладок`)

      for (const tab of tabs) {
        console.log(`[GlassPanel] Проверяем вкладку ${tab.id}`)

        // Проверяем, не является ли вкладка исключенной
        if (shouldExclude && tab.id === shouldExclude) {
          console.log(`[GlassPanel] Вкладка ${tab.id} исключена из рассылки`)
          continue
        }

        // Проверяем доступность вкладки для отправки сообщения
        if (canInjectContentScript(tab.url)) {
          console.log(`[GlassPanel] Отправляем сообщение во вкладку ${tab.id}`)

          // Используем функцию с повторными попытками
          sendMessageWithRetry(tab.id, message, 2, 1000)
        } else {
          console.log(
            `[GlassPanel] Вкладка ${tab.id} недоступна для отправки (url: ${tab.url})`
          )
        }
      }
    })
  } catch (error) {
    console.error("[GlassPanel] Ошибка при широковещательной рассылке:", error)
  }
}
