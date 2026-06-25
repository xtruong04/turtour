using Amazon.S3;
using Amazon.S3.Model;

namespace TurTour.Services
{
    public class R2StorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly IConfiguration _configuration;
        private readonly string _bucketName;
        private readonly string _publicBaseUrl;

        public R2StorageService(IAmazonS3 s3Client, IConfiguration configuration)
        {
            _s3Client = s3Client;
            _configuration = configuration;
            _bucketName = _configuration["R2:BucketName"]
                ?? throw new InvalidOperationException("R2:BucketName chưa được cấu hình.");
            _publicBaseUrl = (_configuration["R2:PublicBaseUrl"] ?? string.Empty).TrimEnd('/');
        }

        public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
        {
            var extension = Path.GetExtension(fileName);
            var key = $"uploads/{DateTime.UtcNow:yyyy/MM}/{Guid.NewGuid()}{extension}";

            var request = new PutObjectRequest
            {
                BucketName = _bucketName,
                Key = key,
                InputStream = fileStream,
                ContentType = contentType,
                DisablePayloadSigning = true
            };

            await _s3Client.PutObjectAsync(request);

            return string.IsNullOrEmpty(_publicBaseUrl)
                ? key
                : $"{_publicBaseUrl}/{key}";
        }

        public async Task DeleteAsync(string key)
        {
            await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
            {
                BucketName = _bucketName,
                Key = key
            });
        }
    }
}
