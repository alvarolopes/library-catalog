# Restore is a separate layer keyed only on the project files, so editing source
# does not re-download the entire NuGet graph on every rebuild.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY LibraryCatalog.slnx ./
COPY src/LibraryCatalog.Api/LibraryCatalog.Api.csproj src/LibraryCatalog.Api/
COPY src/LibraryCatalog.Application/LibraryCatalog.Application.csproj src/LibraryCatalog.Application/
COPY src/LibraryCatalog.Infrastructure/LibraryCatalog.Infrastructure.csproj src/LibraryCatalog.Infrastructure/
COPY tests/LibraryCatalog.Tests/LibraryCatalog.Tests.csproj tests/LibraryCatalog.Tests/
RUN dotnet restore src/LibraryCatalog.Api/LibraryCatalog.Api.csproj

COPY . .
RUN dotnet publish src/LibraryCatalog.Api/LibraryCatalog.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

COPY --from=build /app ./

# The base image ships a non-root 'app' user; a container that does not need
# root should not run as it.
USER app

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "LibraryCatalog.Api.dll"]
