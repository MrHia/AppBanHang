# ---- Build stage: biên dịch & đóng gói bằng Maven (không cần cài Java/Maven trên máy) ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B clean package -DskipTests

# ---- Runtime stage: chạy jar bằng JRE 17 ----
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/AppBanHangBE-1.0.0.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
