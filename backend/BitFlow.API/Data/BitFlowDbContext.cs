using BitFlow.API.Models;
using Microsoft.EntityFrameworkCore;

namespace BitFlow.API.Data;

public sealed class BitFlowDbContext(DbContextOptions<BitFlowDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();

    public DbSet<UserSession> Sessions => Set<UserSession>();

    public DbSet<Project> Projects => Set<Project>();

    public DbSet<Component> Components => Set<Component>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(user => user.Id);
            entity.HasIndex(user => user.NormalizedEmail).IsUnique();
            entity.Property(user => user.Name).IsRequired();
            entity.Property(user => user.Email).IsRequired();
            entity.Property(user => user.NormalizedEmail).IsRequired();
            entity.Property(user => user.PasswordHash).IsRequired();
        });

        modelBuilder.Entity<UserSession>(entity =>
        {
            entity.HasKey(session => session.Token);
            entity.HasIndex(session => session.UserId);
            entity.HasOne(session => session.User)
                .WithMany(user => user.Sessions)
                .HasForeignKey(session => session.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Project>(entity =>
        {
            entity.HasKey(project => project.Id);
            entity.HasIndex(project => new { project.OwnerId, project.UpdatedAt });
            entity.Property(project => project.Name).IsRequired();
            entity.Property(project => project.Description).IsRequired();
            entity.Property(project => project.CircuitJson).IsRequired();
            entity.Property(project => project.InputSignalsJson).IsRequired();
            entity.Property(project => project.CustomComponentsJson).IsRequired();
            entity.HasOne(project => project.Owner)
                .WithMany(user => user.Projects)
                .HasForeignKey(project => project.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Component>(entity =>
        {
            entity.HasKey(component => component.Id);
            entity.HasIndex(component => new { component.OwnerId, component.Name });
            entity.Property(component => component.Name).IsRequired();
            entity.Property(component => component.ComponentJson).IsRequired();
            entity.HasOne(component => component.Owner)
                .WithMany(user => user.Components)
                .HasForeignKey(component => component.OwnerId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
