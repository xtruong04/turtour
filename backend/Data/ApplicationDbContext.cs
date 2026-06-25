using Microsoft.EntityFrameworkCore;
using TurTour.Models.Entities;

namespace TurTour.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
        {
        }
        public DbSet<User> Users { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<UserRole> UserRoles { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<Registration> Registrations { get; set; }
        public DbSet<Feedback> Feedbacks { get; set; }
        public DbSet<Tour> Tours { get; set; }
        public DbSet<CheckIn> CheckIns { get; set; }
        public DbSet<Company> Companies { get; set; }
        public DbSet<TourSchedule> ToursSchedules { get; set; }
        public DbSet<TourImage> TourImages { get; set; }
        public DbSet<Payment> Payments { get; set; }
        public DbSet<Organizator> Organizators { get; set; }
        public DbSet<TourInterest> TourInterests { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);
            // Company
            modelBuilder.Entity<Company>()
                .HasOne(c => c.User)
                .WithMany()
                .HasForeignKey(c => c.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Company>()
                .HasIndex(c => c.UserId)
                .IsUnique();

            // Organizator
            modelBuilder.Entity<Organizator>()
                .HasOne(o => o.User)
                .WithMany()
                .HasForeignKey(o => o.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Organizator>()
                .HasIndex(o => o.Name)
                .IsUnique();

            modelBuilder.Entity<Organizator>()
                .HasIndex(o => o.UserId)
                .IsUnique();

            modelBuilder.Entity<User>()
                .HasIndex(u => u.Email)
                .IsUnique();

            modelBuilder.Entity<Role>()
                .HasIndex(r => r.Name)
                .IsUnique();

            modelBuilder.Entity<UserRole>()
                .HasIndex(ur => new { ur.UserId, ur.RoleId })
                .IsUnique();

            modelBuilder.Entity<Tour>()
                .Property(t => t.Fee)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Tour>()
                .HasOne(t => t.Company)
                .WithMany(c => c.Tours)
                .HasForeignKey(t => t.CompanyId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<TourSchedule>()
                .HasOne(ts => ts.Tour)
                .WithMany(t => t.TourSchedules)
                .HasForeignKey(ts => ts.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TourImage>()
                .HasOne(ti => ti.Tour)
                .WithMany(t => t.TourImages)
                .HasForeignKey(ti => ti.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            // UserRole
            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.User)
                .WithMany(u => u.UserRoles)
                .HasForeignKey(ur => ur.UserId);

            modelBuilder.Entity<UserRole>()
                .HasOne(ur => ur.Role)
                .WithMany(r => r.UserRoles)
                .HasForeignKey(ur => ur.RoleId);

            // Registration
            modelBuilder.Entity<Registration>()
                .HasOne(r => r.Student)
                .WithMany(u => u.Registrations)
                .HasForeignKey(r => r.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Registration>()
                .HasOne(r => r.Tour)
                .WithMany()
                .HasForeignKey(r => r.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Registration>()
                .HasIndex(r => new { r.TourId, r.StudentId })
                .IsUnique();

            modelBuilder.Entity<Payment>()
                .Property(p => p.Amount)
                .HasPrecision(18, 2);

            modelBuilder.Entity<Payment>()
                .HasOne(p => p.Registration)
                .WithOne(r => r.Payment)
                .HasForeignKey<Payment>(p => p.RegistrationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<CheckIn>()
                .HasOne(c => c.Registration)
                .WithOne(r => r.CheckIn)
                .HasForeignKey<CheckIn>(c => c.RegistrationId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Tour)
                .WithMany()
                .HasForeignKey(f => f.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<Feedback>()
                .HasIndex(f => new { f.TourId, f.StudentId })
                .IsUnique();

            // Feedback
            modelBuilder.Entity<Feedback>()
                .HasOne(f => f.Student)
                .WithMany(u => u.Feedbacks)
                .HasForeignKey(f => f.StudentId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Notification>()
                .HasOne(n => n.User)
                .WithMany(u => u.Notifications)
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TourInterest>()
                .HasOne(ti => ti.Tour)
                .WithMany()
                .HasForeignKey(ti => ti.TourId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TourInterest>()
                .HasOne(ti => ti.Student)
                .WithMany()
                .HasForeignKey(ti => ti.StudentId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<TourInterest>()
                .HasIndex(ti => new { ti.TourId, ti.StudentId })
                .IsUnique();
        }
    }
}