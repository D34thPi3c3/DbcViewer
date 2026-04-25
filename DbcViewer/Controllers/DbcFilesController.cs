using DbcViewer.Contracts.DbcFiles;
using DbcViewer.Services;
using Microsoft.AspNetCore.Mvc;

namespace DbcViewer.Controllers;

[ApiController]
[Route("api/dbc-files")]
public sealed class DbcFilesController(IDbcFileService dbcFileService) : ControllerBase
{
    [HttpPost("upload")]
    [Consumes("multipart/form-data")]
    public async Task<ActionResult<DbcFileResponse>> Upload(
        [FromForm] UploadDbcFileRequest request,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.UploadAsync(request.File, cancellationToken);

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return Ok(result.File);
    }
}
