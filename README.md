# «Мобильный мир» — спринт 4

| Задание | Файлы |
|---|---|
| 1, 5, 6. Архитектура | [Схема draw.io](architecture.drawio), последняя вкладка — итог |
| 2. Шардирование | [mongo-sharding](mongo-sharding/README.md) |
| 3. Репликация | [mongo-sharding-repl](mongo-sharding-repl/README.md) |
| 4. Кеширование | [sharding-repl-cache](sharding-repl-cache/README.md) |

## Запуск итогового стенда

```bash
cd sharding-repl-cache
docker compose up -d
docker compose logs -f mongo-init
```

Дождитесь `Initialization finished`. Приложение: http://localhost:8080, Swagger: http://localhost:8080/docs. Имя коллекции — `helloDoc`.

В базе 2000 документов, два шарда по три узла и Redis. Команды проверки — в README каждого этапа. Запускайте один этап одновременно.

Gateway, Consul и CDN показаны только на схеме, как требуется в заданиях 5–6.

Остановка: `docker compose down`. Команда `docker compose down -v` также удаляет тестовые данные.
