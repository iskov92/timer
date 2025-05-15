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

  // Метка времени для отслеживания синхронизации
  const actionTimestamp = Date.now()

  // Отправляем сообщение всем активным вкладкам
  chrome.tabs.query({}, (tabs) => {
    console.log(
      `[GlassPanel] Отправляем сообщение togglePanel(${panelVisible}) на ${tabs.length} вкладок`
    )

    // Считаем, сколько вкладок получат обновление
    let compatibleTabsCount = 0
    tabs.forEach((tab) => {
      if (canInjectContentScript(tab.url)) {
        compatibleTabsCount++
      }
    })
    console.log(
      `[GlassPanel] Из них совместимых вкладок: ${compatibleTabsCount}`
    )

    // Отправляем сообщения только на совместимые вкладки
    tabs.forEach((tab) => {
      if (canInjectContentScript(tab.url)) {
        // Добавляем небольшую задержку для предотвращения гонки условий
        setTimeout(() => {
          try {
            console.log(
              `[GlassPanel] Отправляем togglePanel(${panelVisible}) на вкладку ${tab.id}`
            )
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "togglePanel",
                show: panelVisible,
                timestamp: actionTimestamp,
              },
              (response) => {
                console.log(
                  `[GlassPanel] Ответ на togglePanel от вкладки ${tab.id}:`,
                  response || "нет ответа"
                )
              }
            )
          } catch (error) {
            console.error(
              `[GlassPanel] Ошибка при отправке togglePanel на вкладку ${tab.id}:`,
              error
            )
          }
        }, 50)
      } else {
        console.log(
          `[GlassPanel] Пропускаем отправку на вкладку ${tab.id}, url=${tab.url} (несовместимый URL)`
        )
      }
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
    if (panelVisible && canInjectContentScript(tab.url)) {
      // Даем время для загрузки контент-скрипта
      setTimeout(() => {
        try {
          console.log(
            `[GlassPanel] Отправляем togglePanel(${panelVisible}) на обновленную вкладку ${tabId}`
          )
          chrome.tabs.sendMessage(
            tabId,
            {
              action: "togglePanel",
              show: panelVisible,
              isTabUpdate: true,
              timestamp: Date.now(),
            },
            (response) => {
              console.log(
                `[GlassPanel] Ответ на togglePanel от обновленной вкладки ${tabId}:`,
                response || "нет ответа"
              )
            }
          )
        } catch (error) {
          console.error(
            `[GlassPanel] Ошибка при отправке togglePanel на обновленную вкладку ${tabId}:`,
            error
          )
        }
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

        if (updatedTab && canInjectContentScript(updatedTab.url)) {
          try {
            console.log(
              `[GlassPanel] Отправляем togglePanel(${panelVisible}) на новую вкладку ${tab.id}`
            )
            chrome.tabs.sendMessage(
              tab.id,
              {
                action: "togglePanel",
                show: panelVisible,
                isNewTab: true,
                timestamp: Date.now(),
              },
              (response) => {
                console.log(
                  `[GlassPanel] Ответ на togglePanel от новой вкладки ${tab.id}:`,
                  response || "нет ответа"
                )
              }
            )
          } catch (error) {
            console.error(
              `[GlassPanel] Ошибка при отправке togglePanel на новую вкладку ${tab.id}:`,
              error
            )
          }
        } else {
          console.log(
            `[GlassPanel] Пропускаем отправку на новую вкладку ${tab.id} (несовместимый URL)`
          )
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
    // Меняем статус панели на скрытую
    panelVisible = false
    console.log("[GlassPanel] Обновлено состояние panelVisible =", panelVisible)

    // Отправляем сообщение всем активным вкладкам о закрытии панели
    chrome.tabs.query({}, (tabs) => {
      console.log(
        `[GlassPanel] Отправляем сообщение togglePanel(false) на ${tabs.length} вкладок для закрытия`
      )

      // Метка времени для отслеживания синхронизации
      const closeTimestamp = Date.now()

      tabs.forEach((tab) => {
        // Проверяем, можно ли отправить сообщение на эту вкладку
        if (canInjectContentScript(tab.url)) {
          // Добавляем небольшую задержку для предотвращения гонки условий
          setTimeout(() => {
            try {
              chrome.tabs.sendMessage(
                tab.id,
                {
                  action: "togglePanel",
                  show: false,
                  timestamp: closeTimestamp,
                },
                (response) => {
                  console.log(
                    `[GlassPanel] Ответ на закрытие панели от вкладки ${tab.id}:`,
                    response || "нет ответа"
                  )
                }
              )
            } catch (error) {
              console.error(
                `[GlassPanel] Ошибка при отправке закрытия на вкладку ${tab.id}:`,
                error
              )
            }
          }, 50)
        } else {
          console.log(
            `[GlassPanel] Пропускаем отправку закрытия на вкладку ${tab.id} (несовместимый URL)`
          )
        }
      })
    })

    // Отвечаем на запрос
    sendResponse({
      success: true,
      action: "closePanel",
      status: "панель будет закрыта на всех вкладках",
    })
    return true
  } else if (message.action === "checkPanelState") {
    // Отвечаем на запрос о текущем состоянии панели
    console.log(
      `[GlassPanel] Отвечаем на запрос о состоянии панели: ${panelVisible}`
    )
    sendResponse({
      show: panelVisible,
      timestamp: Date.now(),
    })
    return true
  }

  // Подтверждаем получение сообщения для других типов запросов
  console.log("[GlassPanel] Отправляем подтверждение получения сообщения")
  sendResponse({ success: true })
  return true
})
