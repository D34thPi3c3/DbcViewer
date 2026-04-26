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

    [HttpGet("{fileId:guid}/definition")]
    public async Task<ActionResult<DbcDefinitionResponse>> GetDefinition(
        Guid fileId,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.GetDefinitionAsync(fileId, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return Ok(result.Definition);
    }

    [HttpPost("{fileId:guid}/messages")]
    public async Task<ActionResult<DbcMessageResponse>> CreateMessage(
        Guid fileId,
        [FromBody] UpdateDbcMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.CreateMessageAsync(fileId, request, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return CreatedAtAction(nameof(GetDefinition), new { fileId }, result.Message);
    }

    [HttpPut("{fileId:guid}/messages/{messageId:guid}")]
    public async Task<ActionResult<DbcMessageResponse>> UpdateMessage(
        Guid fileId,
        Guid messageId,
        [FromBody] UpdateDbcMessageRequest request,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.UpdateMessageAsync(fileId, messageId, request, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return Ok(result.Message);
    }

    [HttpDelete("{fileId:guid}/messages/{messageId:guid}")]
    public async Task<IActionResult> DeleteMessage(
        Guid fileId,
        Guid messageId,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.DeleteMessageAsync(fileId, messageId, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        return NoContent();
    }

    [HttpPost("{fileId:guid}/messages/{messageId:guid}/signals")]
    public async Task<ActionResult<DbcSignalResponse>> CreateSignal(
        Guid fileId,
        Guid messageId,
        [FromBody] UpdateDbcSignalRequest request,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.CreateSignalAsync(fileId, messageId, request, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return CreatedAtAction(nameof(GetDefinition), new { fileId }, result.Signal);
    }

    [HttpPut("{fileId:guid}/messages/{messageId:guid}/signals/{signalId:guid}")]
    public async Task<ActionResult<DbcSignalResponse>> UpdateSignal(
        Guid fileId,
        Guid messageId,
        Guid signalId,
        [FromBody] UpdateDbcSignalRequest request,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.UpdateSignalAsync(fileId, messageId, signalId, request, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        if (!result.Succeeded)
        {
            return ValidationProblem(new ValidationProblemDetails(result.Errors));
        }

        return Ok(result.Signal);
    }

    [HttpDelete("{fileId:guid}/messages/{messageId:guid}/signals/{signalId:guid}")]
    public async Task<IActionResult> DeleteSignal(
        Guid fileId,
        Guid messageId,
        Guid signalId,
        CancellationToken cancellationToken)
    {
        var result = await dbcFileService.DeleteSignalAsync(fileId, messageId, signalId, cancellationToken);

        if (result.NotFound)
        {
            return NotFound();
        }

        return NoContent();
    }
}
