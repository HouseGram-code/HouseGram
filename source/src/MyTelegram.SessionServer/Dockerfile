# ---- Runtime base ----
# Run as root: the container bind-mounts ./data/.../session/logs into /app/Logs.
# A non-root user (USER app) cannot write there and the app crashes on startup.
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
# Segfault (exit 139) mitigations for VPS / virtualized CPUs:
#  - GLOBALIZATION_INVARIANT: avoids ICU-related crashes
#  - EnableWriteXorExecute=0: THE classic fix for JIT SIGSEGV on many kernels
#  - TieredCompilation / ReadyToRun off: avoids JIT crashes on odd CPUs
ENV DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 \
    DOTNET_EnableWriteXorExecute=0 \
    DOTNET_TieredCompilation=0 \
    DOTNET_TieredPGO=0 \
    DOTNET_ReadyToRun=0 \
    DOTNET_gcServer=0
WORKDIR /app
RUN mkdir -p /app/Logs

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["src/MyTelegram.SessionServer/MyTelegram.SessionServer.csproj", "src/MyTelegram.SessionServer/"]
RUN dotnet restore "./src/MyTelegram.SessionServer/MyTelegram.SessionServer.csproj"
COPY . .
WORKDIR "/src/src/MyTelegram.SessionServer"
RUN dotnet build "./MyTelegram.SessionServer.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./MyTelegram.SessionServer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MyTelegram.SessionServer.dll"]
