FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/BitFlow.API/BitFlow.API.csproj backend/BitFlow.API/
RUN dotnet restore backend/BitFlow.API/BitFlow.API.csproj

COPY backend/BitFlow.API/ backend/BitFlow.API/
RUN dotnet publish backend/BitFlow.API/BitFlow.API.csproj -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app

ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:8080

RUN mkdir -p /app/Data
COPY --from=build /app/publish .

EXPOSE 8080
ENTRYPOINT ["dotnet", "BitFlow.API.dll"]
