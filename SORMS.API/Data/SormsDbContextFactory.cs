using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;
using SORMS.API.Data;

namespace SORMS.API
{
    public class SormsDbContextFactory : IDesignTimeDbContextFactory<SormsDbContext>
    {
        public SormsDbContext CreateDbContext(string[] args)
        {
            var config = new ConfigurationBuilder()
                .SetBasePath(Directory.GetCurrentDirectory())
                .AddJsonFile("appsettings.json")
                .Build();

            var optionsBuilder = new DbContextOptionsBuilder<SormsDbContext>();
            optionsBuilder.UseNpgsql(config.GetConnectionString("DefaultConnection"));

            return new SormsDbContext(optionsBuilder.Options);
        }
    }
}
