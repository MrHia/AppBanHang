---
title: Docker Compose Stack
category: infra
tags: [docker, mysql, deployment]
sources: [docker-compose.yml, ITSSBE/Dockerfile, SQL/docker-mysql-init.sh]
created: 2026-06-03
updated: 2026-06-03
---

# Docker Compose Stack

> 2 services: MySQL 8.0 (port 3307 host) + Backend Spring Boot (port 8081). FE chưa có trong stack.

## Services

### `db` — MySQL 8.0

```yaml
image: mysql:8.0
environment:
  MYSQL_ALLOW_EMPTY_PASSWORD: "yes"
  MYSQL_DATABASE: import_order_system
ports:
  - "3307:3306"     # host:container
volumes:
  - ./SQL/schema.sql:/schema-src/schema.sql:ro
  - ./SQL/docker-mysql-init.sh:/docker-entrypoint-initdb.d/01-init.sh:ro
healthcheck:
  test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
  interval: 5s
  timeout: 5s
  retries: 30
```

**Why port 3307**: Port 3306 đã bị chiếm bởi 1 project khác trên local (`gamecotuong`). Container vẫn dùng 3306 nội bộ.

**Init script** (`docker-mysql-init.sh`): copy schema.sql → loại 1 dòng MariaDB-only (sed) → import vào MySQL 8. Init chỉ chạy lần đầu khi volume DB rỗng.

### `backend` — Spring Boot 3.1

```yaml
build: ./ITSSBE
environment:
  SPRING_DATASOURCE_URL: jdbc:mysql://db:3306/import_order_system?allowPublicKeyRetrieval=true&useSSL=false&serverTimezone=UTC
  SPRING_DATASOURCE_USERNAME: root
  SPRING_DATASOURCE_PASSWORD: ""
ports:
  - "8081:8081"
depends_on:
  db:
    condition: service_healthy
```

Backend nối db qua **service name** `db:3306` (internal DNS). FE (chưa trong stack) nối `localhost:8081`.

### Backend Dockerfile (multi-stage)

```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml ./
COPY src ./src
RUN mvn clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/AppBanHangBE-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Multi-stage giảm image size (~200MB JRE only, no Maven).

## Lifecycle

| Command | Effect |
|---------|--------|
| `docker compose up --build` | Build BE image + start DB (seed schema.sql) + start BE |
| `docker compose down` | Stop, giữ DB data |
| `docker compose down -v` | Stop + **xóa DB volume** (DB sạch) |

## Networking

| Component | Bind address | Reachable from |
|-----------|--------------|---------------|
| MySQL container | container:3306 | container network (`db:3306`) + host (`localhost:3307`) |
| Spring Boot container | container:8081 | container network + host (`localhost:8081`) |
| Frontend (host) | – | `localhost:8081` (BE), `localhost:3000` (Next.js dev) |

## Risks & Refactor notes

> [!warning] Empty DB password
> `MYSQL_ALLOW_EMPTY_PASSWORD: "yes"` chỉ OK cho local. Prod cần secret-managed password.

> [!warning] Backend khong volume mount source
> Mỗi lần thay đổi BE code phải rebuild image. Dev workflow nên dùng XAMPP + `mvn spring-boot:run` local thay vì Docker (theo README).

> [!info] FE not in compose
> FE chạy `npm run dev` trực tiếp trên host. Refactor: thêm `frontend` service hoặc dùng Nginx reverse proxy production.

> [!warning] No env file
> Credentials hardcoded trong docker-compose.yml. Refactor: tách `.env` (đã gitignore) + `docker-compose.override.yml` cho dev.

> [!tip] Healthcheck only on db
> Backend không có healthcheck. Refactor: thêm Spring Boot Actuator `/actuator/health` + Docker HEALTHCHECK.

> [!info] No persistent volume for DB
> Schema thấy không có `volumes:` named volume cho `/var/lib/mysql`. Mặc định Docker dùng anonymous volume → có thể bị xóa với `docker volume prune`. Refactor: explicit named volume.

## Production gaps

| Gap | Risk | Refactor priority |
|-----|------|-------------------|
| No HTTPS / reverse proxy | High — auth credentials in plaintext over HTTP | P0 |
| No env-based secrets | High — DB pwd, SMTP credentials in repo | P0 |
| No FE in stack | Medium — dev/prod parity | P1 |
| No healthcheck for BE | Medium — orchestration | P1 |
| No persistent named volume | Medium — data loss risk | P1 |
| `hibernate.ddl-auto=update` | High — schema drift, data loss | P0 |
| No CI/CD config | Medium — manual deploy | P2 |
| No logging stack | Medium — debugging | P2 |
| No backup strategy | High — DR | P1 |

## Related

- [[components/backend-architecture]] — runs in this stack
- [[data/schema-overview]] — seeded via SQL volume
- [[analysis/refactor-roadmap]] — addresses these gaps

---

## Backlinks
- [[overview]] — references infra
- [[sources/project-readme]] — quickstart points to docker
