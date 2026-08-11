# See https://aka.ms/customizecontainer to learn how to customize your debug container and how Visual Studio uses this Dockerfile to build your images for faster debugging.

# ---- Runtime base ----
# NOTE: Do NOT switch to $APP_UID here. The container bind-mounts host folders into
# /app/Logs and /app/secrets/mtproto. A non-root user has no write access to those
# bind mounts, which crashes Serilog on startup (observed as exit 139 / SIGSEGV).
# Segfault (exit 139) mitigations for VPS / virtualized CPUs:
#  - GLOBALIZATION_INVARIANT: avoids ICU-related crashes
#  - EnableWriteXorExecute=0: THE classic fix for JIT SIGSEGV on many kernels
#  - TieredCompilation / ReadyToRun off: avoids JIT crashes on odd CPUs
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
ENV DOTNET_RUNNING_IN_CONTAINER=true \
    DOTNET_SYSTEM_GLOBALIZATION_INVARIANT=1 \
    DOTNET_EnableWriteXorExecute=0 \
    DOTNET_TieredCompilation=0 \
    DOTNET_TieredPGO=0 \
    DOTNET_ReadyToRun=0 \
    DOTNET_gcServer=0
WORKDIR /app
RUN mkdir -p /app/Logs /app/secrets/mtproto
EXPOSE 8080
EXPOSE 8081

# ---- Build ----
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src
COPY ["Directory.Packages.props", "."]
COPY ["Directory.Build.props", "."]
COPY ["nuget.config", "."]
COPY ["src/MyTelegram.GatewayServer/MyTelegram.GatewayServer.csproj", "src/MyTelegram.GatewayServer/"]
COPY ["src/MyTelegram.Core/MyTelegram.Core.csproj", "src/MyTelegram.Core/"]
COPY ["src/MyTelegram.Abstractions/MyTelegram.Abstractions.csproj", "src/MyTelegram.Abstractions/"]
COPY ["src/MyTelegram.Domain.Shared/MyTelegram.Domain.Shared.csproj", "src/MyTelegram.Domain.Shared/"]
COPY ["src/MyTelegram.Schema/MyTelegram.Schema.csproj", "src/MyTelegram.Schema/"]
COPY ["src/MyTelegram.EventBus.Rebus/MyTelegram.EventBus.Rebus.csproj", "src/MyTelegram.EventBus.Rebus/"]
COPY ["src/MyTelegram.EventBus/MyTelegram.EventBus.csproj", "src/MyTelegram.EventBus/"]
COPY ["src/MyTelegram.MTProto/MyTelegram.MTProto.csproj", "src/MyTelegram.MTProto/"]
RUN dotnet restore "./src/MyTelegram.GatewayServer/MyTelegram.GatewayServer.csproj"
COPY . .
WORKDIR "/src/src/MyTelegram.GatewayServer"
RUN dotnet build "./MyTelegram.GatewayServer.csproj" -c $BUILD_CONFIGURATION -o /app/build

# ---- Publish ----
FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "./MyTelegram.GatewayServer.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

# ---- Final ----
FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "MyTelegram.GatewayServer.dll"]
