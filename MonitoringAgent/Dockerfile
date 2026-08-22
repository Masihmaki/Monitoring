# syntax=docker/dockerfile:1

FROM mcr.microsoft.com/dotnet/sdk:8.0-alpine AS build
WORKDIR /src
COPY MonitoringAgent.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish MonitoringAgent.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/runtime:8.0-alpine AS runner
WORKDIR /app
ENV DOTNET_ENVIRONMENT=Production
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MonitoringAgent.dll"]
