# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore as distinct layers
COPY ["SORMS.API/SORMS.API.csproj", "SORMS.API/"]
RUN dotnet restore "SORMS.API/SORMS.API.csproj"

# Copy everything else and build
COPY . .
WORKDIR "/src/SORMS.API"
RUN dotnet build "SORMS.API.csproj" -c Release -o /app/build

# Publish stage
FROM build AS publish
RUN dotnet publish "SORMS.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Final stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Expose port and start
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENTRYPOINT ["dotnet", "SORMS.API.dll"]
