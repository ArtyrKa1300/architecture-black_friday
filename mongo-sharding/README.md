# mongo-sharding

Два шарда по одному узлу. Коллекция `somedb.helloDoc` содержит 2000 документов; ключ шардирования — `name` (hashed).

## Запуск и проверка

Из этой папки:

```bash
docker compose up -d
docker compose logs -f mongo-init
```

Дождитесь `Initialization finished`. В логах — количество документов на каждом шарде. Для `mongo-init` ожидается `Exited (0)`.

Приложение: http://localhost:8080. Swagger: http://localhost:8080/docs, коллекция — `helloDoc`.

```bash
curl http://localhost:8080/helloDoc/count
docker compose exec mongos mongosh --quiet --eval "sh.status()"
```

Ожидается 2000 документов, распределённых между двумя шардами.

Остановка: `docker compose down`.
