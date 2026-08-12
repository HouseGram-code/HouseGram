# Opengram — применение исправлений (gateway-server + file-server)

Сервер: **57.151.128.85**, Ubuntu 22.04, Docker, x86_64.

## Что было исправлено

1. **gateway-server** — падал с exit 139 из-за запуска под непривилегированным
   пользователем (`USER $APP_UID`) при смонтированных volume'ах `/app/Logs` и
   `/app/secrets/mtproto` + возможного отсутствия ICU. Dockerfile переписан:
   запуск от root, `DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1`, создаются каталоги
   логов/секретов.
2. **file-server** — тянулся как несуществующий образ
   `${MyTelegramRegistry}/mytelegram-file-server` (нет сборки под amd64 → exit 139).
   Теперь собирается локально из `file-server/` (Node.js), `platform: linux/amd64`.
3. Создан полный **`.env`** со всеми переменными (IP 57.151.128.85).
4. Добавлены `Dockerfile`, `server.js`, `package.json`, `appsettings.json` для file-server.

## Команды на сервере (из папки `docker/compose`)

```bash
# 1. Обновить код (git pull) или скопировать изменённые файлы на сервер
cd ~/opengram/docker/compose        # путь к вашему compose

# 2. Проверить, что .env на месте и валиден
docker compose config >/dev/null && echo "compose OK"

# 3. Остановить и убрать старые павшие контейнеры
docker compose stop gateway-server file-server
docker compose rm -f gateway-server file-server

# 4. Пересобрать оба сервиса без кэша
docker compose build --no-cache gateway-server file-server session-server

# 5. Поднять их
docker compose up -d gateway-server file-server

# 6. Проверить статус (должно быть Up, не Restarting)
docker compose ps

# 7. Посмотреть логи (Ctrl+C для выхода)
docker compose logs -f --tail=50 gateway-server file-server
```

## Проверка

```bash
# file-server healthcheck (внутри сети)
docker compose exec file-server wget -qO- http://127.0.0.1:5000/health
# ожидается: {"status":"ok"}

# порт gateway слушается
ss -tlnp | grep 8443
```

## Если gateway-server всё ещё падает

Пришлите вывод — причина будет в логах явным исключением (уже не segfault):
```bash
docker compose logs --tail=80 gateway-server
```
Частые причины: нет файла `secrets/mtproto/rsa_private.pem` (сгенерируйте ключи,
см. `secrets/mtproto/README.md`) или недоступен RabbitMQ/MongoDB.
